import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeFromQueue, makeQueryChain } from "./helpers/supabase-query-mock";

vi.mock("@/lib/mercado-pago", () => ({
  getMercadoPagoConfigSummary: vi.fn(),
  getMercadoPagoPayment: vi.fn(),
  validateMercadoPagoWebhookSignature: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/mercado-pago/route";
import {
  getMercadoPagoConfigSummary,
  getMercadoPagoPayment,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const mockedConfigSummary = vi.mocked(getMercadoPagoConfigSummary);
const mockedGetPayment = vi.mocked(getMercadoPagoPayment);
const mockedValidateSignature = vi.mocked(validateMercadoPagoWebhookSignature);
const mockedCreateAdminClient = vi.mocked(createSupabaseAdminClient);

type BuildRequestOptions = {
  dataId?: string | null;
  type?: string;
  action?: string;
  requestId?: string | null;
  signature?: string | null;
  body?: Record<string, unknown> | string;
};

const INTERNAL_PAYMENT_ID = "11111111-1111-1111-1111-111111111111";

function buildWebhookRequest(options: BuildRequestOptions = {}): Request {
  const { dataId = "mp-payment-1", type = "payment", requestId = "req-1", signature = "v1=abc", body } = options;

  const url = new URL("https://laff-finder.example.com/api/webhooks/mercado-pago");
  if (dataId !== null) {
    url.searchParams.set("data.id", dataId);
  }

  const rawBody = typeof body === "string" ? body : JSON.stringify(body ?? { type, data: { id: dataId } });

  const headers = new Headers();
  if (requestId !== null) headers.set("x-request-id", requestId);
  if (signature !== null) headers.set("x-signature", signature);
  headers.set("content-type", "application/json");

  return new Request(url, { method: "POST", headers, body: rawBody });
}

function approvedMercadoPagoPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "mp-payment-1",
    status: "approved",
    external_reference: INTERNAL_PAYMENT_ID,
    currency_id: "BRL",
    transaction_amount: 199.9,
    ...overrides,
  };
}

function operationalInternalPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: INTERNAL_PAYMENT_ID,
    enrollment_id: "enrollment-1",
    gateway: "mercado_pago",
    amount: 199.9,
    currency: "BRL",
    status: "pending",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedConfigSummary.mockReturnValue({ hasAccessToken: true, hasPublicKey: true, hasWebhookSecret: true });
  mockedValidateSignature.mockImplementation(() => undefined);
});

describe("POST /api/webhooks/mercado-pago — autenticação e payload", () => {
  it("rejeita quando o secret do webhook não está configurado (503, sem tocar assinatura)", async () => {
    mockedConfigSummary.mockReturnValue({ hasAccessToken: true, hasPublicKey: true, hasWebhookSecret: false });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ received: false, error: "webhook_unavailable" });
    expect(mockedValidateSignature).not.toHaveBeenCalled();
  });

  it("payload JSON inválido → 400 invalid_payload", async () => {
    const response = await POST(buildWebhookRequest({ body: "{ isso não é json" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ received: false, error: "invalid_payload" });
    expect(mockedValidateSignature).not.toHaveBeenCalled();
  });

  it("sem x-signature → 401 invalid_signature (validador chamado com xSignature nulo)", async () => {
    mockedValidateSignature.mockImplementation(() => {
      throw new Error("assinatura ausente");
    });

    const response = await POST(buildWebhookRequest({ signature: null }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ received: false, error: "invalid_signature" });
    expect(mockedValidateSignature).toHaveBeenCalledWith(
      expect.objectContaining({ xSignature: null }),
    );
  });

  it("x-signature inválida → 401 invalid_signature", async () => {
    mockedValidateSignature.mockImplementation(() => {
      throw new Error("assinatura inválida");
    });

    const response = await POST(buildWebhookRequest({ signature: "v1=forjada" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ received: false, error: "invalid_signature" });
  });

  it("sem x-request-id → 401 invalid_signature, sem sequer chamar o validador de assinatura", async () => {
    const response = await POST(buildWebhookRequest({ requestId: null }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ received: false, error: "invalid_signature" });
    expect(mockedValidateSignature).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercado-pago — eventos que não são pagamento", () => {
  it("evento que não é 'payment' é ignorado sem consultar Mercado Pago ou Supabase", async () => {
    const response = await POST(
      buildWebhookRequest({ body: { type: "subscription_preapproval", data: { id: "irrelevante" } } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(mockedGetPayment).not.toHaveBeenCalled();
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercado-pago — vínculo do data.id assinado", () => {
  it("evento de pagamento sem data.id na query assinada → 400 payment_id_mismatch, sem MP/Supabase/RPC", async () => {
    const response = await POST(buildWebhookRequest({ dataId: null }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ received: false, error: "payment_id_mismatch" });
    expect(mockedGetPayment).not.toHaveBeenCalled();
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("usa EXATAMENTE o data.id da query assinada para consultar o Mercado Pago, ignorando um data.id diferente no corpo", async () => {
    const admin = { from: makeFromQueue([makeQueryChain({ data: null, error: null })]), rpc: vi.fn() };
    mockedCreateAdminClient.mockReturnValue(admin as never);
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ id: "query-data-id" }) as never);

    await POST(
      buildWebhookRequest({
        dataId: "query-data-id",
        body: { type: "payment", data: { id: "id-diferente-no-corpo" } },
      }),
    );

    expect(mockedGetPayment).toHaveBeenCalledTimes(1);
    expect(mockedGetPayment).toHaveBeenCalledWith("query-data-id");
  });
});

describe("POST /api/webhooks/mercado-pago — validação da resposta do Mercado Pago", () => {
  it("Mercado Pago retorna um id diferente do solicitado → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ id: "outro-id" }) as never);

    const response = await POST(buildWebhookRequest({ dataId: "mp-payment-1" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("Mercado Pago não retorna external_reference → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ external_reference: null }) as never);

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("erro temporário ao consultar o Mercado Pago → 500 gateway_unavailable", async () => {
    mockedGetPayment.mockRejectedValue(new Error("timeout"));

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ received: false, error: "gateway_unavailable" });
  });
});

describe("POST /api/webhooks/mercado-pago — cruzamento com o payment interno", () => {
  function mockAdminWithPayment(paymentResult: { data: unknown; error: unknown }) {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const admin = { from: makeFromQueue([makeQueryChain(paymentResult)]), rpc };
    mockedCreateAdminClient.mockReturnValue(admin as never);
    return admin;
  }

  it("external_reference aponta para payment inexistente → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const admin = mockAdminWithPayment({ data: null, error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("erro do banco ao buscar o payment → 500 database_unavailable", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    mockAdminWithPayment({ data: null, error: { message: "conexão perdida" } });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ received: false, error: "database_unavailable" });
  });

  it("gateway interno diferente de mercado_pago → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment({ gateway: "stripe" }), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("moeda interna diferente de BRL → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment({ currency: "USD" }), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("moeda do Mercado Pago diferente de BRL → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ currency_id: "USD" }) as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment(), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("valor interno diferente do valor no Mercado Pago → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ transaction_amount: 50 }) as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment({ amount: 199.9 }), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("payment interno já aprovado → idempotência, sem nova aprovação", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment({ status: "approved" }), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, alreadyProcessed: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("payment interno em estado não operacional (ex.: cancelled) → ignorado", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment({ status: "cancelled" }), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("Mercado Pago não aprovado → não ativa enrollment (RPC não é chamada)", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment({ status: "in_process" }) as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment(), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, processed: true });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("Mercado Pago aprovado → chama mark_payment_approved com os dados corretos", async () => {
    const gatewayPayment = approvedMercadoPagoPayment();
    mockedGetPayment.mockResolvedValue(gatewayPayment as never);
    const admin = mockAdminWithPayment({ data: operationalInternalPayment(), error: null });

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, processed: true });
    expect(admin.rpc).toHaveBeenCalledWith("mark_payment_approved", {
      p_payment_id: INTERNAL_PAYMENT_ID,
      p_gateway_payment_id: "mp-payment-1",
      p_raw_webhook_payload: expect.objectContaining({ type: "payment" }),
    });
  });

  it("erro na RPC de aprovação → 500 approval_unavailable", async () => {
    mockedGetPayment.mockResolvedValue(approvedMercadoPagoPayment() as never);
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "rpc falhou" } });
    const admin = { from: makeFromQueue([makeQueryChain({ data: operationalInternalPayment(), error: null })]), rpc };
    mockedCreateAdminClient.mockReturnValue(admin as never);

    const response = await POST(buildWebhookRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ received: false, error: "approval_unavailable" });
  });
});

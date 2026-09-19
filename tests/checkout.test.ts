import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeFromQueue, makeQueryChain } from "./helpers/supabase-query-mock";

const { preferenceCreate, preferenceGet, PreferenceMock } = vi.hoisted(() => {
  const preferenceCreate = vi.fn();
  const preferenceGet = vi.fn();
  const PreferenceMock = vi.fn().mockImplementation(() => ({ create: preferenceCreate, get: preferenceGet }));
  return { preferenceCreate, preferenceGet, PreferenceMock };
});

vi.mock("mercadopago", () => ({ Preference: PreferenceMock }));

vi.mock("@/lib/mercado-pago", () => ({
  getMercadoPagoClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/payments", () => ({
  resolveProductById: vi.fn(),
  resolvePlanById: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { createMercadoPagoCheckout } from "@/lib/mercado-pago-checkout";
import { resolveProductById, resolvePlanById } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const mockedResolveProductById = vi.mocked(resolveProductById);
const mockedResolvePlanById = vi.mocked(resolvePlanById);
const mockedCreateAdminClient = vi.mocked(createSupabaseAdminClient);

const USER_ID = "user-1";
const ENROLLMENT_ID = "enrollment-1";
const PRODUCT_ID = "product-1";
const PAYMENT_ID = "payment-1";

function pendingEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: ENROLLMENT_ID,
    student_id: USER_ID,
    status: "pending",
    product_id: PRODUCT_ID,
    plan_id: null,
    ...overrides,
  };
}

function mockAdminWithEnrollment(enrollment: unknown, extraChains: unknown[] = []) {
  const chains = [makeQueryChain({ data: enrollment, error: null }), ...extraChains];
  const admin = { from: makeFromQueue(chains) };
  mockedCreateAdminClient.mockReturnValue(admin as never);
  return admin;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://finder.example.com";
  mockedResolveProductById.mockResolvedValue({
    ok: true,
    data: { id: PRODUCT_ID, slug: "diagnostico", name: "Diagnóstico", price: 199.9 } as never,
  });
});

describe("createMercadoPagoCheckout — autorização e estado do enrollment", () => {
  it("usuário não autenticado (userId vazio) não pode iniciar checkout", async () => {
    const result = await createMercadoPagoCheckout("", ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "unauthenticated", message: expect.any(String) });
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("enrollment de outro usuário não pode ser usado", async () => {
    mockAdminWithEnrollment(pendingEnrollment({ student_id: "outro-usuario" }));

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "not_found", message: expect.any(String) });
  });

  it("enrollment inexistente não pode ser usado", async () => {
    mockAdminWithEnrollment(null);

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "not_found", message: expect.any(String) });
  });

  it("enrollment que não está pending não gera checkout", async () => {
    mockAdminWithEnrollment(pendingEnrollment({ status: "active" }));

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "not_pending", message: expect.any(String) });
  });
});

describe("createMercadoPagoCheckout — produto/plano", () => {
  it("produto inativo/inválido não gera checkout", async () => {
    mockAdminWithEnrollment(pendingEnrollment());
    mockedResolveProductById.mockResolvedValue({ ok: false, error: "inactive" });

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "product_unavailable", message: expect.any(String) });
  });

  it("produto sem preço válido não gera checkout", async () => {
    mockAdminWithEnrollment(pendingEnrollment());
    mockedResolveProductById.mockResolvedValue({
      ok: true,
      data: { id: PRODUCT_ID, slug: "diagnostico", name: "Diagnóstico", price: null } as never,
    });

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "product_unavailable", message: expect.any(String) });
  });

  it("usa resolvePlanById quando o enrollment referencia um plano em vez de um produto", async () => {
    mockAdminWithEnrollment(pendingEnrollment({ product_id: null, plan_id: "plan-1" }), [
      makeQueryChain({ data: [], error: null }),
      makeQueryChain({ data: { id: PAYMENT_ID, amount: 299, gateway_preference_id: null }, error: null }),
      makeQueryChain({ data: null, error: null }),
    ]);
    mockedResolvePlanById.mockResolvedValue({
      ok: true,
      data: { id: "plan-1", slug: "plano-x", name: "Plano X", price: 299 } as never,
    });
    preferenceCreate.mockResolvedValue({ id: "pref-1", init_point: "https://mp.example/checkout/pref-1" });

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(mockedResolvePlanById).toHaveBeenCalledWith("plan-1");
    expect(result.success).toBe(true);
  });
});

describe("createMercadoPagoCheckout — preço e vínculo com o Mercado Pago", () => {
  it("o valor usado na preferência vem do payment persistido no banco, não de nenhum input do chamador", async () => {
    mockAdminWithEnrollment(pendingEnrollment(), [
      makeQueryChain({ data: [], error: null }),
      makeQueryChain({ data: { id: PAYMENT_ID, amount: 199.9, gateway_preference_id: null }, error: null }),
      makeQueryChain({ data: null, error: null }),
    ]);
    preferenceCreate.mockResolvedValue({ id: "pref-1", init_point: "https://mp.example/checkout/pref-1" });

    // A assinatura de createMercadoPagoCheckout só aceita userId e
    // enrollmentId — não há price/amount de entrada possível. Este teste
    // confirma que o valor enviado ao Mercado Pago é o `amount` já
    // persistido em `payments` (retornado pelo insert mockado acima).
    await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(preferenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: [expect.objectContaining({ unit_price: 199.9 })],
        }),
      }),
    );
  });

  it("external_reference da preferência é o id do payment interno", async () => {
    mockAdminWithEnrollment(pendingEnrollment(), [
      makeQueryChain({ data: [], error: null }),
      makeQueryChain({ data: { id: PAYMENT_ID, amount: 199.9, gateway_preference_id: null }, error: null }),
      makeQueryChain({ data: null, error: null }),
    ]);
    preferenceCreate.mockResolvedValue({ id: "pref-1", init_point: "https://mp.example/checkout/pref-1" });

    await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(preferenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ external_reference: PAYMENT_ID }) }),
    );
  });

  it("notification_url usa NEXT_PUBLIC_APP_URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app-de-teste.example.com";
    mockAdminWithEnrollment(pendingEnrollment(), [
      makeQueryChain({ data: [], error: null }),
      makeQueryChain({ data: { id: PAYMENT_ID, amount: 199.9, gateway_preference_id: null }, error: null }),
      makeQueryChain({ data: null, error: null }),
    ]);
    preferenceCreate.mockResolvedValue({ id: "pref-1", init_point: "https://mp.example/checkout/pref-1" });

    await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(preferenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          notification_url: "https://app-de-teste.example.com/api/webhooks/mercado-pago",
          back_urls: {
            success: "https://app-de-teste.example.com/pagamento/sucesso",
            failure: "https://app-de-teste.example.com/pagamento/falha",
            pending: "https://app-de-teste.example.com/pagamento/pendente",
          },
        }),
      }),
    );
  });

  it("sem NEXT_PUBLIC_APP_URL configurado, falha em vez de usar um fallback implícito", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockAdminWithEnrollment(pendingEnrollment());

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({ success: false, error: "app_url_missing", message: expect.any(String) });
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("não existe URL de produção hardcoded em lib/mercado-pago-checkout.ts nem na rota de checkout", () => {
    const checkoutLibSource = readFileSync(
      path.resolve(__dirname, "../lib/mercado-pago-checkout.ts"),
      "utf8",
    );
    const checkoutRouteSource = readFileSync(
      path.resolve(__dirname, "../app/api/checkout/mercado-pago/route.ts"),
      "utf8",
    );

    // As back_urls/notification_url devem vir sempre de `${appUrl}` (por
    // sua vez lido de NEXT_PUBLIC_APP_URL) — nenhuma URL http(s) literal
    // deve aparecer no CÓDIGO de nenhum dos dois arquivos. Comentários
    // (ex.: explicando por que o fallback de lib/config.ts é evitado
    // aqui) são ignorados nesta checagem.
    const stripLineComments = (source: string) =>
      source
        .split("\n")
        .map((line) => line.replace(/\/\/.*/, ""))
        .join("\n");

    expect(stripLineComments(checkoutLibSource)).not.toMatch(/https?:\/\//);
    expect(stripLineComments(checkoutRouteSource)).not.toMatch(/https?:\/\//);
  });
});

describe("createMercadoPagoCheckout — reaproveitamento e concorrência", () => {
  it("reaproveita um payment pending/processing existente com preferência ainda válida, sem criar um novo payment", async () => {
    mockAdminWithEnrollment(pendingEnrollment(), [
      makeQueryChain({
        data: [{ id: PAYMENT_ID, amount: 199.9, gateway_preference_id: "pref-existente" }],
        error: null,
      }),
    ]);
    preferenceGet.mockResolvedValue({ init_point: "https://mp.example/checkout/pref-existente" });

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({
      success: true,
      initPoint: "https://mp.example/checkout/pref-existente",
      preferenceId: "pref-existente",
      paymentId: PAYMENT_ID,
    });
    expect(preferenceCreate).not.toHaveBeenCalled();
  });

  it("concorrência: uma corrida de INSERT (23505) reaproveita o payment que venceu, sem criar um segundo payment operacional", async () => {
    const racedPayment = { id: "payment-da-corrida", amount: 199.9, gateway_preference_id: null };
    mockAdminWithEnrollment(pendingEnrollment(), [
      // 1) busca inicial: nenhum payment pending/processing ainda
      makeQueryChain({ data: [], error: null }),
      // 2) INSERT perde a corrida: índice único parcial barra a duplicata
      makeQueryChain({ data: null, error: { code: "23505", message: "duplicate key" } }),
      // 3) nova busca encontra o payment que a requisição concorrente criou
      makeQueryChain({ data: racedPayment, error: null }),
      // 4) atualização do gateway_preference_id no payment reaproveitado
      makeQueryChain({ data: null, error: null }),
    ]);
    preferenceCreate.mockResolvedValue({ id: "pref-corrida", init_point: "https://mp.example/checkout/pref-corrida" });

    const result = await createMercadoPagoCheckout(USER_ID, ENROLLMENT_ID);

    expect(result).toEqual({
      success: true,
      initPoint: "https://mp.example/checkout/pref-corrida",
      preferenceId: "pref-corrida",
      paymentId: "payment-da-corrida",
    });
    expect(preferenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ external_reference: "payment-da-corrida" }) }),
    );
  });
});

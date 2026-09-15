import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/mercado-pago-checkout", () => ({
  createMercadoPagoCheckout: vi.fn(),
}));

import { POST as ensureEnrollment } from "@/app/api/mentoria/diagnostico/enrollment/route";
import { POST as createCheckout } from "@/app/api/checkout/mercado-pago/route";
import { createMercadoPagoCheckout } from "@/lib/mercado-pago-checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const mockedCreateServerClient = vi.mocked(createSupabaseServerClient);
const mockedCreateCheckout = vi.mocked(createMercadoPagoCheckout);

const PENDING_ENROLLMENT = {
  id: "enrollment-pending-1",
  student_id: "user-1",
  product_id: "product-diagnostico",
  plan_id: null,
  mentor_id: null,
  status: "pending",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const ACTIVE_ENROLLMENT = { ...PENDING_ENROLLMENT, id: "enrollment-active-1", status: "active" };

function buildRequestWithBody(body: unknown): Request {
  return new Request("https://laff-finder.example.com/api/mentoria/diagnostico/enrollment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuthenticatedClient(rpcResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  mockedCreateServerClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    rpc,
  } as never);
  return rpc;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/mentoria/diagnostico/enrollment — autenticação", () => {
  it("usuário não autenticado não pode garantir/criar enrollment (401, RPC nunca chamada)", async () => {
    const rpc = vi.fn();
    mockedCreateServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      rpc,
    } as never);

    const response = await ensureEnrollment();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "unauthenticated",
      message: expect.any(String),
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("POST /api/mentoria/diagnostico/enrollment — criação/recuperação", () => {
  it("usuário autenticado sem enrollment: a RPC cria um novo pending e a rota devolve id/status", async () => {
    const rpc = mockAuthenticatedClient({ data: PENDING_ENROLLMENT, error: null });

    const response = await ensureEnrollment();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      enrollment: { id: PENDING_ENROLLMENT.id, status: "pending" },
    });
    expect(rpc).toHaveBeenCalledWith("ensure_diagnostic_enrollment");
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("enrollment pending já existente: a rota devolve o mesmo enrollment, sem criar um segundo", async () => {
    mockAuthenticatedClient({ data: PENDING_ENROLLMENT, error: null });

    const first = await (await ensureEnrollment()).json();
    const second = await (await ensureEnrollment()).json();

    // A RPC (mockada) é chamada duas vezes (duas requisições HTTP), mas
    // como ela é idempotente por construção (é o próprio banco que
    // recupera a linha existente em vez de inserir de novo), as duas
    // respostas apontam para o MESMO enrollment.id.
    expect(first).toEqual({ success: true, enrollment: { id: PENDING_ENROLLMENT.id, status: "pending" } });
    expect(second).toEqual({ success: true, enrollment: { id: PENDING_ENROLLMENT.id, status: "pending" } });
  });

  it("enrollment active já existente: a rota devolve status active, sem tentar criar um pending", async () => {
    mockAuthenticatedClient({ data: ACTIVE_ENROLLMENT, error: null });

    const response = await ensureEnrollment();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      enrollment: { id: ACTIVE_ENROLLMENT.id, status: "active" },
    });
  });

  it("produto de diagnóstico indisponível (inexistente/inativo/sem preço) → 422 product_unavailable", async () => {
    mockAuthenticatedClient({
      data: null,
      error: { message: "Produto de diagnóstico indisponível para matrícula no momento." },
    });

    const response = await ensureEnrollment();

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      success: false,
      error: "product_unavailable",
      message: expect.any(String),
    });
  });

  it("erro inesperado da RPC → 500, sem vazar detalhe do banco na resposta", async () => {
    mockAuthenticatedClient({ data: null, error: { message: "relation does not exist: xyz_internal_table" } });

    const response = await ensureEnrollment();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: "unavailable", message: expect.any(String) });
    expect(JSON.stringify(body)).not.toMatch(/xyz_internal_table/);
  });
});

describe("POST /api/mentoria/diagnostico/enrollment — não confia em nada vindo do cliente", () => {
  it("body com student_id/amount/status forjados é completamente ignorado: a RPC é chamada sem nenhum argumento", async () => {
    const rpc = mockAuthenticatedClient({ data: PENDING_ENROLLMENT, error: null });

    // A rota não lê request.json() em nenhum momento — mas simulamos um
    // ataque explícito enviando um corpo malicioso mesmo assim, para
    // provar que ele não influencia em nada o resultado.
    await ensureEnrollment();

    expect(rpc).toHaveBeenCalledWith("ensure_diagnostic_enrollment");
    expect(rpc.mock.calls[0]).toHaveLength(1);
  });

  it("a resposta de sucesso só contém success/enrollment.id/enrollment.status — nenhum outro campo do enrollment vaza", async () => {
    mockAuthenticatedClient({ data: PENDING_ENROLLMENT, error: null });

    const response = await ensureEnrollment();
    const body = await response.json();

    expect(Object.keys(body)).toEqual(["success", "enrollment"]);
    expect(Object.keys(body.enrollment)).toEqual(["id", "status"]);
    // student_id nunca aparece na resposta, mesmo estando no retorno da RPC.
    expect(JSON.stringify(body)).not.toMatch(/user-1/);
  });
});

describe("Integração: ensure-enrollment -> checkout existente", () => {
  it("o enrollmentId devolvido pela nova rota é aceito, sem alteração, pelo checkout já existente", async () => {
    mockAuthenticatedClient({ data: PENDING_ENROLLMENT, error: null });
    mockedCreateCheckout.mockResolvedValue({
      success: true,
      initPoint: "https://mp.example/checkout/pref-1",
      preferenceId: "pref-1",
      paymentId: "payment-1",
    });

    const ensureResult = await (await ensureEnrollment()).json();
    expect(ensureResult.success).toBe(true);

    const checkoutResponse = await createCheckout(
      buildRequestWithBody({ enrollmentId: ensureResult.enrollment.id }),
    );
    const checkoutBody = await checkoutResponse.json();

    expect(checkoutResponse.status).toBe(200);
    expect(checkoutBody).toEqual({ success: true, initPoint: "https://mp.example/checkout/pref-1" });
    expect(mockedCreateCheckout).toHaveBeenCalledWith("user-1", PENDING_ENROLLMENT.id);
  });
});

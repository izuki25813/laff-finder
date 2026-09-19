import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mercado-pago-checkout", () => ({
  createMercadoPagoCheckout: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { POST } from "@/app/api/checkout/mercado-pago/route";
import { createMercadoPagoCheckout } from "@/lib/mercado-pago-checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const mockedCreateCheckout = vi.mocked(createMercadoPagoCheckout);
const mockedCreateServerClient = vi.mocked(createSupabaseServerClient);

function buildRequest(body: unknown): Request {
  return new Request("https://finder.example.com/api/checkout/mercado-pago", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/checkout/mercado-pago — autenticação", () => {
  it("usuário não autenticado não pode iniciar checkout (401, sem chamar o checkout)", async () => {
    mockedCreateServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    const response = await POST(buildRequest({ enrollmentId: "enrollment-1" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "unauthenticated",
      message: expect.any(String),
    });
    expect(mockedCreateCheckout).not.toHaveBeenCalled();
  });

  it("não expõe segredos: em sucesso, a resposta só contém success/initPoint", async () => {
    mockedCreateServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    } as never);
    mockedCreateCheckout.mockResolvedValue({
      success: true,
      initPoint: "https://mp.example/checkout/pref-1",
      preferenceId: "pref-1",
      paymentId: "payment-1",
    });

    const response = await POST(buildRequest({ enrollmentId: "enrollment-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, initPoint: "https://mp.example/checkout/pref-1" });
    expect(mockedCreateCheckout).toHaveBeenCalledWith("user-1", "enrollment-1");
  });

  it("enrollmentId ausente/ inválido → 400, sem chamar o checkout", async () => {
    mockedCreateServerClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    } as never);

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(400);
    expect(mockedCreateCheckout).not.toHaveBeenCalled();
  });
});

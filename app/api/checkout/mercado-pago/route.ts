import { NextResponse } from "next/server";

import { createMercadoPagoCheckout, type CheckoutErrorCode } from "@/lib/mercado-pago-checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/checkout/mercado-pago
// Body: { enrollmentId: string }
//
// Único input aceito do cliente é enrollmentId. amount, price, productId,
// planId, studentId, currency, gateway, externalReference e return URLs
// nunca são aceitos aqui — tudo isso é resolvido no servidor
// (lib/mercado-pago-checkout.ts) a partir do banco.

type CheckoutRequestBody = {
  enrollmentId: string;
};

function parseCheckoutRequestBody(value: unknown): CheckoutRequestBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = (value as Record<string, unknown>).enrollmentId;

  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return null;
  }

  return { enrollmentId: candidate };
}

const ERROR_STATUS: Record<CheckoutErrorCode, number> = {
  unauthenticated: 401,
  not_found: 404,
  not_pending: 409,
  product_unavailable: 422,
  app_url_missing: 500,
  gateway_error: 502,
  persist_error: 500,
  unavailable: 503,
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "unavailable", message: "Configuração do Supabase indisponível." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: "unauthenticated", message: "Faça login para continuar." },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid_request", message: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const body = parseCheckoutRequestBody(rawBody);
  if (!body) {
    return NextResponse.json(
      { success: false, error: "invalid_request", message: "enrollmentId é obrigatório." },
      { status: 400 },
    );
  }

  const result = await createMercadoPagoCheckout(user.id, body.enrollmentId);

  if (!result.success) {
    const { details, ...errorResult } = result;
    return NextResponse.json(
      { success: false, error: errorResult.error, message: errorResult.message, ...(details && { details }) },
      { status: ERROR_STATUS[result.error] ?? 400 },
    );
  }

  return NextResponse.json({
    success: true,
    initPoint: result.initPoint,
  });
}

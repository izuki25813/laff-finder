import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/mentoria/diagnostico/enrollment
//
// Não aceita nenhum body. O único input é a sessão do usuário
// autenticado (student_id nunca vem do cliente). Cria (ou recupera) a
// matrícula pending/active do diagnóstico via a RPC
// ensure_diagnostic_enrollment() (Fase 10.7), que resolve o produto e
// aplica toda a regra de concorrência dentro do próprio banco — esta
// rota não decide nada disso, só traduz o resultado para HTTP.
//
// NÃO cria payment, NÃO fala com o Mercado Pago e NÃO aprova/ativa
// nada: só garante que existe uma matrícula pending para o checkout
// existente (POST /api/checkout/mercado-pago) poder usar em seguida.

type EnsureEnrollmentErrorCode = "unauthenticated" | "product_unavailable" | "unavailable";

const PRODUCT_UNAVAILABLE_MESSAGE = "Produto de diagnóstico indisponível";

const ERROR_RESPONSES: Record<EnsureEnrollmentErrorCode, { status: number; message: string }> = {
  unauthenticated: { status: 401, message: "Faça login para continuar." },
  product_unavailable: {
    status: 422,
    message: "Produto de diagnóstico indisponível para matrícula no momento.",
  },
  unavailable: { status: 500, message: "Não foi possível iniciar a matrícula. Tente novamente." },
};

function fail(error: EnsureEnrollmentErrorCode) {
  const { status, message } = ERROR_RESPONSES[error];
  return NextResponse.json({ success: false, error, message }, { status });
}

export async function POST() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fail("unavailable");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return fail("unauthenticated");
  }

  const { data, error } = await supabase.rpc("ensure_diagnostic_enrollment");

  if (error || !data) {
    if (error?.message?.includes(PRODUCT_UNAVAILABLE_MESSAGE)) {
      return fail("product_unavailable");
    }

    return fail("unavailable");
  }

  return NextResponse.json({
    success: true,
    enrollment: { id: data.id, status: data.status },
  });
}

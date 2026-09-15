import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const FALLBACK_PATH = "/mentoria/diagnostico";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const normalizedTarget = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(normalizedTarget, requestUrl);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const gameplayUrl = String(formData.get("gameplay_url") ?? "").trim();
  const gameplayTitle = String(formData.get("gameplay_title") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();
  const nextUrl = String(formData.get("next") ?? FALLBACK_PATH);

  if (!gameplayUrl) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=erro-link");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(FALLBACK_PATH)}`, request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(FALLBACK_PATH)}`, request.url));
  }

  const { data: diagnosticRequest, error: fetchError } = await supabase
    .from("diagnostic_requests")
    .select("id, student_id, status")
    .eq("id", id)
    .maybeSingle();

  // Checagem explícita de dono e de status, além do que a RLS já garante:
  // o aluno só edita material próprio, e só enquanto pending/awaiting_info.
  if (fetchError || !diagnosticRequest || diagnosticRequest.student_id !== user.id) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=nao-autorizado");
  }

  if (diagnosticRequest.status !== "pending" && diagnosticRequest.status !== "awaiting_info") {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=nao-autorizado");
  }

  // Apenas material de entrada é atualizado. status, result, mentor_id,
  // completed_at, student_id e enrollment_id nunca são tocados aqui — o
  // trigger no banco rejeitaria qualquer tentativa mesmo que fosse.
  const { error: updateError } = await supabase
    .from("diagnostic_requests")
    .update({
      gameplay_url: gameplayUrl,
      gameplay_title: gameplayTitle || null,
      context: context || null,
    })
    .eq("id", id)
    .eq("student_id", user.id);

  if (updateError) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=erro");
  }

  return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=atualizado");
}

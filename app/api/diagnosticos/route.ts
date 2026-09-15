import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const FALLBACK_PATH = "/mentoria/diagnostico";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const normalizedTarget = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(normalizedTarget, requestUrl);
}

export async function POST(request: Request) {
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

  // O servidor determina a matrícula do usuário autenticado; o cliente
  // nunca informa enrollment_id, product_id ou student_id diretamente.
  const { data: diagnosticProducts } = await supabase
    .from("mentoring_products")
    .select("id")
    .eq("product_type", "diagnostic")
    .eq("active", true);

  const diagnosticProductIds = (diagnosticProducts ?? []).map((item) => item.id);

  const { data: enrollments } = diagnosticProductIds.length
    ? await supabase
        .from("mentorship_enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("status", "active")
        .in("product_id", diagnosticProductIds)
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: [] as Array<{ id: string }> };

  const enrollment = enrollments?.[0] ?? null;

  if (!enrollment) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=sem-matricula");
  }

  const { data: existingRequest } = await supabase
    .from("diagnostic_requests")
    .select("id")
    .eq("enrollment_id", enrollment.id)
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=ja-existe");
  }

  // result, mentor_id, completed_at e status nunca são aceitos do cliente:
  // ficam de fora do insert, e o trigger no banco rejeita qualquer tentativa
  // de defini-los por um usuário não-admin.
  const { error: insertError } = await supabase.from("diagnostic_requests").insert({
    enrollment_id: enrollment.id,
    student_id: user.id,
    gameplay_url: gameplayUrl,
    gameplay_title: gameplayTitle || null,
    context: context || null,
    status: "pending",
  });

  if (insertError) {
    // 23505 = unique_violation no índice único de enrollment_id: duas
    // requisições simultâneas não podem gerar dois diagnósticos.
    const alreadyExists = insertError.code === "23505";
    return NextResponse.redirect(
      getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + `?status=${alreadyExists ? "ja-existe" : "erro"}`,
    );
  }

  return NextResponse.redirect(getSafeRedirect(nextUrl, FALLBACK_PATH, request.url).toString() + "?status=enviado");
}

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const normalizedTarget = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(normalizedTarget, requestUrl);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const nextUrl = String(formData.get("next") ?? "/dashboard");

  if (!action) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=acao-invalida");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(nextUrl)}`, request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(nextUrl)}`, request.url));
  }

  const { data: application, error: applicationError } = await supabase
    .from("team_applications")
    .select("id, vacancy_id, team_id, player_id, status")
    .eq("id", id)
    .maybeSingle();

  if (applicationError || !application) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=nao-encontrada");
  }

  const { data: vacancy } = await supabase
    .from("team_vacancies")
    .select("id, team_id")
    .eq("id", application.vacancy_id)
    .maybeSingle();

  if (!vacancy) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=vaga-nao-encontrada");
  }

  const { data: teamOwner } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", vacancy.team_id)
    .maybeSingle();

  const isOwner = vacancy.team_id === application.team_id && teamOwner?.owner_id === user.id;
  const isApplicant = application.player_id === user.id;

  if (action === "cancel") {
    if (!isApplicant || application.status !== "pending") {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=nao-autorizado");
    }

    const { error: cancelError } = await supabase
      .from("team_applications")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("player_id", user.id)
      .eq("status", "pending");

    if (cancelError) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=erro-cancelamento");
    }

    return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=cancelada");
  }

  if (action === "accept" || action === "reject") {
    if (!isOwner || application.status !== "pending") {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=nao-autorizado");
    }

    const { error: updateError } = await supabase
      .from("team_applications")
      .update({ status: action === "accept" ? "accepted" : "rejected" })
      .eq("id", id)
      .eq("team_id", application.team_id)
      .eq("status", "pending");

    if (updateError) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=erro-atualizacao");
    }

    return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=" + (action === "accept" ? "aceita" : "recusada"));
  }

  return NextResponse.redirect(getSafeRedirect(nextUrl, "/dashboard", request.url).toString() + "?status=acao-invalida");
}

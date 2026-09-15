import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const normalizedTarget = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(normalizedTarget, requestUrl);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const message = String(formData.get("message") ?? "").trim();
  const nextUrl = String(formData.get("next") ?? `/vaga/${id}`);

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/vaga/${id}`)}`, request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/vaga/${id}`)}`, request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(new URL(`/perfil?next=${encodeURIComponent(`/vaga/${id}`)}`, request.url));
  }

  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!playerProfile) {
    return NextResponse.redirect(new URL(`/perfil?next=${encodeURIComponent(`/vaga/${id}`)}`, request.url));
  }

  const { data: vacancy, error: vacancyError } = await supabase
    .from("team_vacancies")
    .select("id, team_id, status")
    .eq("id", id)
    .maybeSingle();

  if (vacancyError || !vacancy || vacancy.status !== "open") {
    return NextResponse.redirect(getSafeRedirect(nextUrl, `/vaga/${id}`, request.url).toString() + "?status=vaga-fechada");
  }

  const { data: teamOwner } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", vacancy.team_id)
    .maybeSingle();

  if (teamOwner?.owner_id === user.id) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, `/vaga/${id}`, request.url).toString() + "?status=dono-da-vaga");
  }

  const { data: existingApplication } = await supabase
    .from("team_applications")
    .select("id")
    .eq("vacancy_id", id)
    .eq("player_id", user.id)
    .maybeSingle();

  if (existingApplication) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, `/vaga/${id}`, request.url).toString() + "?status=duplicada");
  }

  const { error: insertError } = await supabase.from("team_applications").insert({
    vacancy_id: id,
    team_id: vacancy.team_id,
    player_id: user.id,
    message: message || null,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, `/vaga/${id}`, request.url).toString() + "?status=erro");
  }

  return NextResponse.redirect(getSafeRedirect(nextUrl, `/vaga/${id}`, request.url).toString() + "?status=enviada");
}

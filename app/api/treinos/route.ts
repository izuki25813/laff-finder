import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const candidate = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(candidate, requestUrl);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const nextUrl = String(formData.get("next") ?? "/treinos/novo");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/treinos/novo")}`, request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/treinos/novo")}`, request.url));
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const trainingType = String(formData.get("training_type") ?? "").trim();
  const competitiveLevel = String(formData.get("competitive_level") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const scheduledAt = String(formData.get("scheduled_at") ?? "").trim();
  const durationMinutes = String(formData.get("duration_minutes") ?? "").trim();
  const maxParticipants = String(formData.get("max_participants") ?? "4").trim();
  const teamId = String(formData.get("team_id") ?? "").trim();

  if (!title || !trainingType || !scheduledAt) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos/novo", request.url).toString() + "?status=erro-validacao");
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos/novo", request.url).toString() + "?status=data-invalida");
  }

  const parsedMinutes = durationMinutes ? Number(durationMinutes) : null;
  const parsedMaxParticipants = Number(maxParticipants);

  if ((parsedMinutes !== null && Number.isNaN(parsedMinutes)) || parsedMinutes === 0 || parsedMaxParticipants <= 0) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos/novo", request.url).toString() + "?status=erro-validacao");
  }

  let ownerTeamId: string | null = null;
  if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!team) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos/novo", request.url).toString() + "?status=time-invalido");
    }

    ownerTeamId = team.id;
  }

  const payload = {
    created_by: user.id,
    team_id: ownerTeamId,
    title,
    description: description || null,
    training_type: trainingType,
    competitive_level: competitiveLevel || null,
    region: region || null,
    state: state || null,
    city: city || null,
    scheduled_at: new Date(scheduledAt).toISOString(),
    duration_minutes: parsedMinutes,
    max_participants: parsedMaxParticipants,
    status: "open",
  };

  const { data: createdTraining, error: insertError } = await supabase
    .from("training_sessions")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !createdTraining) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos/novo", request.url).toString() + "?status=erro-criacao");
  }

  return NextResponse.redirect(new URL(`/treino/${createdTraining.id}?status=criado`, request.url));
}

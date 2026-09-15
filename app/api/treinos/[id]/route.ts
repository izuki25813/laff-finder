import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeRedirect(nextUrl: string, fallbackUrl: string, requestUrl: string) {
  const candidate = nextUrl && nextUrl.startsWith("/") ? nextUrl : fallbackUrl;
  return new URL(candidate, requestUrl);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const nextUrl = String(formData.get("next") ?? `/treino/${id}`);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/treino/${id}`)}`, request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/treino/${id}`)}`, request.url));
  }

  const { data: session } = await supabase
    .from("training_sessions")
    .select("id, created_by, status, max_participants")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos", request.url).toString() + "?status=nao-encontrado");
  }

  if (action === "cancel") {
    if (session.created_by !== user.id) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos", request.url).toString() + "?status=nao-autorizado");
    }

    const { error } = await supabase
      .from("training_sessions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos", request.url).toString() + "?status=erro-cancelamento");
    }

    return NextResponse.redirect(new URL(`/treino/${id}?status=cancelado`, request.url));
  }

  if (action === "update") {
    if (session.created_by !== user.id) {
      return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos", request.url).toString() + "?status=nao-autorizado");
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
    const maxParticipants = String(formData.get("max_participants") ?? String(session.max_participants)).trim();
    const status = String(formData.get("status") ?? session.status).trim();
    const teamId = String(formData.get("team_id") ?? "").trim();

    if (!title || !trainingType || !scheduledAt) {
      return NextResponse.redirect(new URL(`/treino/${id}/editar?status=erro-validacao`, request.url));
    }

    const scheduleDate = new Date(scheduledAt);
    if (Number.isNaN(scheduleDate.getTime())) {
      return NextResponse.redirect(new URL(`/treino/${id}/editar?status=data-invalida`, request.url));
    }

    const parsedMaxParticipants = Number(maxParticipants);
    const parsedDuration = durationMinutes ? Number(durationMinutes) : null;
    if (parsedMaxParticipants <= 0 || (parsedDuration !== null && parsedDuration <= 0)) {
      return NextResponse.redirect(new URL(`/treino/${id}/editar?status=erro-validacao`, request.url));
    }

    const currentParticipants = await supabase
      .from("training_participants")
      .select("id", { count: "exact" })
      .eq("training_id", id);

    if (currentParticipants.count !== null && parsedMaxParticipants < currentParticipants.count) {
      return NextResponse.redirect(new URL(`/treino/${id}/editar?status=limite-invalido`, request.url));
    }

    let finalTeamId: string | null = null;
    if (teamId) {
      const { data: memberTeam } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!memberTeam) {
        return NextResponse.redirect(new URL(`/treino/${id}/editar?status=time-invalido`, request.url));
      }

      finalTeamId = memberTeam.id;
    }

    const { error } = await supabase
      .from("training_sessions")
      .update({
        title,
        description: description || null,
        training_type: trainingType,
        competitive_level: competitiveLevel || null,
        region: region || null,
        state: state || null,
        city: city || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parsedDuration,
        max_participants: parsedMaxParticipants,
        status,
        team_id: finalTeamId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      return NextResponse.redirect(new URL(`/treino/${id}/editar?status=erro-atualizacao`, request.url));
    }

    return NextResponse.redirect(new URL(`/treino/${id}?status=atualizado`, request.url));
  }

  return NextResponse.redirect(getSafeRedirect(nextUrl, "/treinos", request.url).toString() + "?status=acao-invalida");
}

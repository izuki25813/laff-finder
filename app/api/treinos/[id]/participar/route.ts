import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
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

  const { error } = await supabase.rpc("join_training_session", { training_id: id });

  if (error) {
    const fallback = nextUrl.startsWith("/") ? nextUrl : `/treino/${id}`;
    return NextResponse.redirect(new URL(`${fallback}?status=erro-participacao`, request.url));
  }

  return NextResponse.redirect(new URL(`${nextUrl}?status=participou`, request.url));
}

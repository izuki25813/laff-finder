import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import TreinoEditarClient from "./TreinoEditarClient";

export default async function EditarTreinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("training_sessions")
    .select("*, team:teams(id, name, tag)")
    .eq("id", id)
    .eq("created_by", profile.id)
    .maybeSingle();

  if (!session) {
    redirect("/treinos");
  }

  const { data: teams } = await supabase.from("teams").select("id, name, tag").eq("owner_id", profile.id).order("name", { ascending: true });

  return <TreinoEditarClient initialSession={session} teams={teams ?? []} />;
}

import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import VagasClient from "./VagasClient";

export const metadata = {
  title: "Vagas do time",
  description: "Gerencie as vagas do seu time no FINDER",
};

export default async function VagasPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: team } = await supabase.from("teams").select("id").eq("owner_id", profile.id).maybeSingle();

  if (!team) {
    redirect("/meu-time");
  }

  const { data: vacancies } = await supabase
    .from("team_vacancies")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  return <VagasClient userId={profile.id} initialTeamId={team.id} initialVacancies={vacancies ?? []} />;
}

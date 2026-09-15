import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

import PerfilClient from "./PerfilClient";

export const metadata = {
  title: "Perfil",
  description: "Seu perfil de usuário no LAFF Finder",
};

export default async function PerfilPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  return <PerfilClient userId={profile.id} initialProfile={playerProfile ?? null} />;
}

import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import TreinosNovoClient from "./TreinosNovoClient";

export const metadata = {
  title: "Novo treino",
  description: "Criar um treino no LAFF Finder",
};

export default async function NovoTreinoPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: teams } = await supabase.from("teams").select("id, name, tag").eq("owner_id", profile.id).order("name", { ascending: true });

  return <TreinosNovoClient teams={teams ?? []} />;
}

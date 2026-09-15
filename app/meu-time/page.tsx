import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import MeuTimeClient from "./MeuTimeClient";

export const metadata = {
  title: "Meu time",
  description: "Gerencie seu time em LAFF Finder",
};

export default async function MeuTimePage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  return <MeuTimeClient userId={profile.id} />;
}

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  nickname: string | null;
  role: "USER" | "ADMIN";
  created_at: string;
  updated_at: string;
};

export async function getServerSession() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function getCurrentProfile(): Promise<AppProfile | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return profile as AppProfile;
}

export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireProfile() {
  const session = await requireAuth();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return { session, profile };
}

export async function requireAdminAccess() {
  const { profile } = await requireProfile();

  if (profile?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return profile;
}

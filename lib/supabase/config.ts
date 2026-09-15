export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

export const hasSupabaseConfig = Boolean(
  supabaseConfig.url && supabaseConfig.anonKey,
);

export function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error(
      "Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return supabaseConfig;
}

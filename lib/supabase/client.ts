import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return null;
  }

  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

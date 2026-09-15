import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

// Cliente com service role — bypassa RLS. A Fase 10.2 desenhou
// deliberadamente public.payments sem NENHUMA policy de INSERT/UPDATE/
// DELETE para usuário comum nem ADMIN: toda escrita operacional (criação
// do payment pending pelo checkout, persistência de gateway_preference_id)
// é responsabilidade do backend/service role, por design — não é uma
// forma de contornar RLS, é o caminho que a própria RLS já previu.
//
// "server-only" garante em build-time que este módulo nunca pode ser
// importado por um Client Component, protegendo SUPABASE_SERVICE_ROLE_KEY
// de chegar ao bundle do navegador.
//
// Nunca usar este cliente para decidir "de quem" é um dado (ele enxerga
// tudo, de todo mundo) — a checagem de propriedade/autorização precisa
// acontecer antes, com o cliente autenticado do próprio usuário
// (createSupabaseServerClient) ou por comparação explícita de IDs.

export function createSupabaseAdminClient() {
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    return null;
  }

  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

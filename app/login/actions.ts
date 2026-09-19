"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";
import { getSafeInternalPath } from "@/lib/safe-redirect";

export type LoginActionState = {
  error?: string;
  message?: string;
};

export async function loginAction(
  prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = formData.get("next");

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  const supabase = await createSupabaseServerActionClient();

  if (!supabase) {
    return { error: "Configuração do Supabase indisponível." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: String(email),
    password: String(password),
  });

  if (signInError) {
    return {
      error:
        signInError.message.includes("Invalid login credentials")
          ? "Credenciais inválidas. Verifique seu email e senha."
          : signInError.message,
    };
  }

  const safeNext = getSafeInternalPath(next as string | null, "/dashboard");
  redirect(safeNext);
}
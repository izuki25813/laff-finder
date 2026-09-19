"use client";

import Link from "next/link";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError("Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.");
      setLoading(false);
      return;
    }

    const { error: recoverError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    });

    if (recoverError) {
      setError(recoverError.message || "Não foi possível enviar o link de recuperação.");
      setLoading(false);
      return;
    }

    setMessage("Se esse email estiver cadastrado, enviaremos um link de recuperação.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-yellow-500/10">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
            <h1 className="text-3xl font-black">Recuperar senha</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                placeholder="seu@email.com"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-green-500/50 bg-green-950/30 px-3 py-2 text-sm text-green-200">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-300">
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

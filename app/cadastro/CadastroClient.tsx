"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CadastroClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError("Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Não foi possível criar a conta.");
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: signUpData.user.id,
          email: signUpData.user.email,
          full_name: signUpData.user.user_metadata?.full_name ?? null,
          role: "USER",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        console.error("Profile creation failed", profileError);
        setError("Conta criada, mas houve um problema ao registrar seu perfil. Tente entrar novamente.");
        setLoading(false);
        return;
      }

      setSuccess("Conta criada com sucesso! Você já pode entrar no painel.");
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-yellow-500/10">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
            <h1 className="text-3xl font-black">Criar conta</h1>
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

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-green-500/50 bg-green-950/30 px-3 py-2 text-sm text-green-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <div>
              Já tem conta?{" "}
              <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
                Fazer login
              </Link>
            </div>
            <div>
              <Link href="/recuperar-senha" className="text-yellow-400 hover:text-yellow-300">
                Esqueci minha senha
              </Link>
            </div>
            <div>
              <Link href="/" className="text-zinc-400 hover:text-white">
                Voltar para a home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

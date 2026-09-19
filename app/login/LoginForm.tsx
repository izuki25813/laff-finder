"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "./actions";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, { error: "", message: "" });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-yellow-500/10">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
            <h1 className="text-3xl font-black">Entrar</h1>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="next" value={next} />

            {state.error ? (
              <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {state.error}
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <div>
              <Link href="/recuperar-senha" className="text-yellow-400 hover:text-yellow-300">
                Esqueci minha senha
              </Link>
            </div>
            <div>
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="text-yellow-400 hover:text-yellow-300">
                Criar conta
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

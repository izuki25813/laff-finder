import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !team) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Time</h1>
          </div>

          <Link href="/" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar para a home
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800">
                {team.logo_url ? (
                  <Image
                    src={team.logo_url}
                    alt={team.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-yellow-400">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black text-white">{team.name}</h2>
                  {team.tag ? (
                    <span className="rounded-full border border-yellow-500/60 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                      {team.tag}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-300">
                  {team.region ? <span>Região: {team.region}</span> : null}
                  {team.state ? <span>Estado: {team.state}</span> : null}
                  {team.city ? <span>Cidade: {team.city}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Dados do time</h3>
              <dl className="space-y-3 text-sm text-zinc-300">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Jogo</dt>
                  <dd className="font-medium text-white">{team.main_game}</dd>
                </div>
                {team.competitive_level ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Nível</dt>
                    <dd className="font-medium text-white">{team.competitive_level}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="font-medium text-white">{team.status}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Descrição</h3>
              <p className="text-sm leading-7 text-zinc-300">
                {team.description || "Este time ainda não adicionou uma descrição."}
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

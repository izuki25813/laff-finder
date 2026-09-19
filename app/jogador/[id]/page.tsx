import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function JogadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const { data: playerProfile, error } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !playerProfile) {
    notFound();
  }

  const socialLinks = [
    { label: "YouTube", value: playerProfile.youtube_url },
    { label: "Instagram", value: playerProfile.instagram_url },
    { label: "TikTok", value: playerProfile.tiktok_url },
    { label: "Twitch", value: playerProfile.twitch_url },
  ].filter((item) => Boolean(item.value));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
            <h1 className="mt-2 text-3xl font-black">Perfil do jogador</h1>
          </div>

          <Link href="/" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar para a home
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-zinc-900/80 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                {playerProfile.avatar_url ? (
                  <Image
                    src={playerProfile.avatar_url}
                    alt={playerProfile.nickname ?? "Jogador"}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-yellow-400">
                    {playerProfile.nickname?.slice(0, 2).toUpperCase() ?? "J"}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black text-white">{playerProfile.nickname ?? "Jogador"}</h2>
                  {playerProfile.looking_for_team ? (
                    <span className="rounded-full border border-green-500/60 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-300">
                      Procurando equipe
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
                      Não procurando
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-300">
                  {playerProfile.region ? <span>Região: {playerProfile.region}</span> : null}
                  {playerProfile.state ? <span>Estado: {playerProfile.state}</span> : null}
                  {playerProfile.city ? <span>Cidade: {playerProfile.city}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Dados competitivos</h3>
              <dl className="space-y-3 text-sm text-zinc-300">
                {playerProfile.primary_role ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Função principal</dt>
                    <dd className="font-medium text-white">{playerProfile.primary_role}</dd>
                  </div>
                ) : null}
                {playerProfile.secondary_role ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Função secundária</dt>
                    <dd className="font-medium text-white">{playerProfile.secondary_role}</dd>
                  </div>
                ) : null}
                {playerProfile.competitive_objective ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Objetivo</dt>
                    <dd className="font-medium text-white">{playerProfile.competitive_objective}</dd>
                  </div>
                ) : null}
                {playerProfile.experience_level ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Experiência</dt>
                    <dd className="font-medium text-white">{playerProfile.experience_level}</dd>
                  </div>
                ) : null}
                {playerProfile.availability ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Disponibilidade</dt>
                    <dd className="font-medium text-white">{playerProfile.availability}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Sobre</h3>
              {playerProfile.bio ? (
                <p className="text-sm leading-7 text-zinc-300">{playerProfile.bio}</p>
              ) : (
                <p className="text-sm text-zinc-500">Este jogador ainda não adicionou uma bio.</p>
              )}
            </section>
          </div>

          {socialLinks.length > 0 ? (
            <div className="border-t border-zinc-800 p-6 md:p-8">
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Redes sociais</h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.value!}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </main>
  );
}

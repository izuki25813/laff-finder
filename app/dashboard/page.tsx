import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: playerProfile } = supabase
    ? await supabase.from("player_profiles").select("*").eq("id", profile.id).maybeSingle()
    : { data: null };

  const { data: team } = supabase
    ? await supabase.from("teams").select("*").eq("owner_id", profile.id).maybeSingle()
    : { data: null };

  const { data: vacancyCount } = supabase
    ? await supabase.from("team_vacancies").select("id", { count: "exact" }).eq("team_id", team?.id ?? "__none__")
    : { data: null };

  let myApplicationsCount = 0;
  let myTeamApplicationsCount = 0;

  if (supabase) {
    try {
      const { count: myCount } = await supabase
        .from("team_applications")
        .select("id", { count: "exact" })
        .eq("player_id", profile.id);

      myApplicationsCount = myCount ?? 0;
    } catch {
      myApplicationsCount = 0;
    }

    if (team?.id) {
      try {
        const { count: teamCount } = await supabase
          .from("team_applications")
          .select("id", { count: "exact" })
          .eq("team_id", team.id);

        myTeamApplicationsCount = teamCount ?? 0;
      } catch {
        myTeamApplicationsCount = 0;
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Dashboard</h1>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white transition hover:border-red-500 hover:text-red-400"
            >
              Sair
            </button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-black text-yellow-400">Usuário</h2>
            <dl className="space-y-3 text-sm text-zinc-300">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-right font-medium text-white">{profile.email ?? "Sem email"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Nome</dt>
                <dd className="text-right font-medium text-white">{profile.full_name ?? "Sem nome"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Role</dt>
                <dd className="text-right font-medium text-yellow-400">{profile.role}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-black text-yellow-400">MEU PERFIL</h2>
            {playerProfile ? (
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-xs font-black text-yellow-400">
                    {playerProfile.avatar_url ? (
                      <Image
                        src={playerProfile.avatar_url}
                        alt={playerProfile.nickname ?? "Jogador"}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span>{(playerProfile.nickname ?? "J").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{playerProfile.nickname ?? "Sem nickname"}</p>
                    <p>{playerProfile.primary_role ?? "Função não definida"}</p>
                  </div>
                </div>
                <p>Objetivo: {playerProfile.competitive_objective ?? "Não informado"}</p>
                <p>Status: {playerProfile.looking_for_team ? "Procurando equipe" : "Não procurando"}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/perfil" className="rounded-xl bg-yellow-400 px-3 py-2 font-black text-black">
                    Editar perfil
                  </Link>
                  <Link href={`/jogador/${profile.id}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Ver perfil
                  </Link>
                  <Link href="/minhas-candidaturas" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Minhas candidaturas ({myApplicationsCount})
                  </Link>
                  <Link href="/meus-treinos" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Meus treinos
                  </Link>
                  <Link href="/mentoria/diagnostico" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Diagnóstico
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-zinc-300">
                <p>Complete seu perfil competitivo.</p>
                <Link href="/perfil" className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
                  Completar perfil
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-black text-yellow-400">MEU TIME</h2>
            {team ? (
              <div className="space-y-3 text-sm text-zinc-300">
                <p className="font-bold text-white">{team.name}</p>
                <p>{team.tag ? `Tag: ${team.tag}` : "Tag não definida"}</p>
                <p>{team.competitive_level ?? "Nível competitivo não informado"}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/meu-time" className="rounded-xl bg-yellow-400 px-3 py-2 font-black text-black">
                    Gerenciar time
                  </Link>
                  <Link href={`/time/${team.id}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Ver time
                  </Link>
                  <Link href="/meu-time/candidaturas" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Candidaturas do meu time ({myTeamApplicationsCount})
                  </Link>
                  <Link href="/treinos" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white">
                    Treinos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-zinc-300">
                <p>Crie seu time.</p>
                <Link href="/meu-time" className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
                  Criar time
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:col-span-2">
            <h2 className="mb-4 text-xl font-black text-yellow-400">VAGAS</h2>
            {team ? (
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Total de vagas: {vacancyCount?.length ?? 0}</p>
                <Link href="/meu-time/vagas" className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
                  Gerenciar vagas
                </Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-300">Crie um time primeiro para publicar vagas.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

import Image from "next/image";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

export default async function TeamApplicationsPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!team) {
    redirect("/meu-time");
  }

  const { data: applications } = await supabase
    .from("team_applications")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  const vacancyIds = (applications ?? []).map((item) => item.vacancy_id);
  const playerIds = (applications ?? []).map((item) => item.player_id);

  const { data: vacancies } = vacancyIds.length
    ? await supabase.from("team_vacancies").select("id, title, role, experience_level, team_id, created_at").in("id", vacancyIds)
    : { data: [] as Array<{ id: string; title: string; role: string; experience_level: string | null; team_id: string; created_at: string }> };

  const { data: playerProfiles } = playerIds.length
    ? await supabase
        .from("player_profiles")
        .select("id, nickname, avatar_url, primary_role, secondary_role, competitive_objective, experience_level, city, state, region")
        .in("id", playerIds)
    : { data: [] as Array<{ id: string; nickname: string | null; avatar_url: string | null; primary_role: string | null; secondary_role: string | null; competitive_objective: string | null; experience_level: string | null; city: string | null; state: string | null; region: string | null }> };

  const mapVacancy = new Map((vacancies ?? []).map((item) => [item.id, item]));
  const mapPlayer = new Map((playerProfiles ?? []).map((item) => [item.id, item]));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Candidaturas do meu time</h1>
          </div>

          <a href="/meu-time" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar ao time
          </a>
        </div>

        {(!applications || applications.length === 0) ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
            Ainda não há candidaturas para o seu time.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const vacancy = mapVacancy.get(application.vacancy_id);
              const player = mapPlayer.get(application.player_id);

              return (
                <article key={application.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
                        {player?.avatar_url ? (
                          <Image
                            src={player.avatar_url}
                            alt={player.nickname ?? "Candidato"}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-yellow-400">
                            {(player?.nickname ?? "C").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <a href={`/jogador/${application.player_id}`} className="text-xl font-black text-white hover:text-yellow-400">
                          {player?.nickname ?? "Candidato"}
                        </a>
                        <p className="text-sm text-zinc-400">{player?.primary_role ?? "Função não informada"}</p>
                      </div>
                    </div>

                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                      {STATUS_LABELS[application.status] ?? application.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Vaga</span>
                      <span className="mt-2 block font-medium text-white">{vacancy?.title ?? "Vaga"}</span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Cargo</span>
                      <span className="mt-2 block font-medium text-white">{vacancy?.role ?? "Cargo"}</span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Experiência</span>
                      <span className="mt-2 block font-medium text-white">{player?.experience_level ?? "—"}</span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Objetivo</span>
                      <span className="mt-2 block font-medium text-white">{player?.competitive_objective ?? "—"}</span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Localização</span>
                      <span className="mt-2 block font-medium text-white">{[player?.city, player?.state, player?.region].filter(Boolean).join(" / ") || "—"}</span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                      <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">Data</span>
                      <span className="mt-2 block font-medium text-white">{new Date(application.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {application.message ? (
                    <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm leading-6 text-zinc-300">
                      {application.message}
                    </p>
                  ) : null}

                  {application.status === "pending" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <form action={`/api/candidaturas/${application.id}`} method="POST">
                        <input type="hidden" name="action" value="accept" />
                        <input type="hidden" name="next" value="/meu-time/candidaturas" />
                        <button type="submit" className="rounded-xl bg-green-500 px-4 py-2 text-sm font-black text-black">
                          ACEITAR
                        </button>
                      </form>

                      <form action={`/api/candidaturas/${application.id}`} method="POST">
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="next" value="/meu-time/candidaturas" />
                        <button type="submit" className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-200">
                          RECUSAR
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

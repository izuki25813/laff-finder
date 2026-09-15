import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

export default async function MinhasCandidaturasPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: applications } = await supabase
    .from("team_applications")
    .select("*")
    .eq("player_id", profile.id)
    .order("created_at", { ascending: false });

  const vacancyIds = (applications ?? []).map((item) => item.vacancy_id);
  const teamIds = (applications ?? []).map((item) => item.team_id);

  const { data: vacancies } = vacancyIds.length
    ? await supabase.from("team_vacancies").select("id, title, role, status, created_at, team_id").in("id", vacancyIds)
    : { data: [] as Array<{ id: string; title: string; role: string; status: string; created_at: string; team_id: string }> };

  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("id, name, tag").in("id", teamIds)
    : { data: [] as Array<{ id: string; name: string; tag: string | null }> };

  const mapVacancy = new Map((vacancies ?? []).map((item) => [item.id, item]));
  const mapTeam = new Map((teams ?? []).map((item) => [item.id, item]));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Minhas candidaturas</h1>
          </div>

          <a href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar ao dashboard
          </a>
        </div>

        {(!applications || applications.length === 0) ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
            Você ainda não enviou nenhuma candidatura.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const vacancy = mapVacancy.get(application.vacancy_id);
              const team = mapTeam.get(application.team_id);

              return (
                <article key={application.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">{team?.tag ?? "Time"}</p>
                      <h2 className="mt-2 text-2xl font-black text-white">{vacancy?.title ?? "Vaga"}</h2>
                      <p className="text-sm text-zinc-400">{team?.name ?? "Time"} · {vacancy?.role ?? "Cargo"}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                        {STATUS_LABELS[application.status] ?? application.status}
                      </span>
                      <p className="text-xs text-zinc-400">
                        {new Date(application.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {application.message ? (
                    <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm leading-6 text-zinc-300">
                      {application.message}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a href={`/vaga/${application.vacancy_id}`} className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                      Ver vaga
                    </a>

                    {application.status === "pending" ? (
                      <form action={`/api/candidaturas/${application.id}`} method="POST">
                        <input type="hidden" name="action" value="cancel" />
                        <input type="hidden" name="next" value="/minhas-candidaturas" />
                        <button type="submit" className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-200">
                          Cancelar candidatura
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

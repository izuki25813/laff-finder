import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

export default async function VagaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsValue = (await searchParams) ?? {};
  const statusMessage = Array.isArray(paramsValue.status) ? paramsValue.status[0] : paramsValue.status;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const { data: vacancy, error } = await supabase
    .from("team_vacancies")
    .select("*, team:teams(name, tag, logo_url, region, state, city, owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (error || !vacancy) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  const isOwner = Boolean(userId && vacancy.team?.owner_id === userId);
  const canApply = vacancy.status === "open" && !isOwner;

  let playerProfile = null as { id: string } | null;
  let application = null as { id: string; status: string } | null;

  if (userId) {
    const { data: profileData } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    playerProfile = profileData;

    const { data: applicationData } = await supabase
      .from("team_applications")
      .select("id, status")
      .eq("vacancy_id", id)
      .eq("player_id", userId)
      .maybeSingle();

    application = applicationData;
  }

  const authActionMessage = (() => {
    switch (statusMessage) {
      case "enviada":
        return "Candidatura enviada com sucesso.";
      case "duplicada":
        return "Você já enviou uma candidatura para esta vaga.";
      case "vaga-fechada":
        return "Esta vaga está fechada e não aceita novas candidaturas.";
      case "dono-da-vaga":
        return "Você é o dono desta vaga e não pode se candidatar.";
      case "erro":
        return "Não foi possível enviar a candidatura no momento.";
      case "nao-autorizado":
        return "Você não está autorizado a realizar esta ação.";
      default:
        return "";
    }
  })();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
            <h1 className="mt-2 text-3xl font-black">Vaga</h1>
          </div>

          <Link href="/vagas" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar para vagas
          </Link>
        </div>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
          {authActionMessage ? (
            <div className="mb-6 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              {authActionMessage}
            </div>
          ) : null}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">{vacancy.team?.name ?? "Time"}</p>
              <h2 className="text-3xl font-black text-white">{vacancy.title}</h2>
            </div>
            <span className="rounded-full border border-green-500/60 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-300">
              {vacancy.status}
            </span>
          </div>

          <dl className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><dt className="text-sm text-zinc-500">Função</dt><dd className="mt-1 font-medium text-white">{vacancy.role}</dd></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><dt className="text-sm text-zinc-500">Nível</dt><dd className="mt-1 font-medium text-white">{vacancy.experience_level || "—"}</dd></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><dt className="text-sm text-zinc-500">Objetivo</dt><dd className="mt-1 font-medium text-white">{vacancy.competitive_objective || "—"}</dd></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><dt className="text-sm text-zinc-500">Disponibilidade</dt><dd className="mt-1 font-medium text-white">{vacancy.availability || "—"}</dd></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:col-span-2"><dt className="text-sm text-zinc-500">Localização</dt><dd className="mt-1 font-medium text-white">{[vacancy.city, vacancy.state, vacancy.region].filter(Boolean).join(" / ") || "—"}</dd></div>
          </dl>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Descrição</h3>
              <p className="text-sm leading-7 text-zinc-300">{vacancy.description || "Descrição não informada."}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Requisitos</h3>
              <p className="text-sm leading-7 text-zinc-300">{vacancy.requirements || "Não foram informados requisitos específicos."}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            Publicada em {new Date(vacancy.created_at).toLocaleDateString("pt-BR")}
          </div>

          <div className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            {!userId ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">Para se candidatar, faça login e complete seu perfil.</p>
                <Link href={`/login?next=${encodeURIComponent(`/vaga/${id}`)}`} className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
                  Quero me candidatar
                </Link>
              </div>
            ) : !playerProfile ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">Você precisa completar o seu perfil antes de se candidatar.</p>
                <Link href={`/perfil?next=${encodeURIComponent(`/vaga/${id}`)}`} className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
                  Completar perfil
                </Link>
              </div>
            ) : isOwner ? (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                Você é o dono da vaga e não pode se candidatar a ela.
              </div>
            ) : !canApply ? (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                Esta vaga está fechada e não aceita novas candidaturas.
              </div>
            ) : application ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">Candidatura enviada</p>
                <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
                  Status: {statusLabels[application.status] ?? application.status}
                </div>
              </div>
            ) : (
              <form action={`/api/vagas/${id}/candidatar`} method="POST" className="space-y-4">
                <input type="hidden" name="next" value={`/vaga/${id}`} />
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span className="font-medium">Mensagem opcional</span>
                  <textarea
                    name="message"
                    rows={5}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                    placeholder="Fale brevemente sobre você, sua experiência e por que acredita que pode ajudar o time."
                  />
                </label>

                <button type="submit" className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-black">
                  Enviar candidatura
                </button>
              </form>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

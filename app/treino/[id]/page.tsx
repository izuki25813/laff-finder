import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  full: "Lotado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

export default async function TreinoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paramsValue = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const { data: session } = await supabase
    .from("training_sessions")
    .select("*, team:teams(id, name, tag), creator:profiles!created_by(id, nickname, full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;
  const { data: participant } = user
    ? await supabase
        .from("training_participants")
        .select("id")
        .eq("training_id", id)
        .eq("player_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: participants } = await supabase
    .from("training_participants")
    .select("id, created_at, player_id")
    .eq("training_id", id)
    .order("created_at", { ascending: true });

  const participantIds = (participants ?? []).map((item) => item.player_id);
  const { data: participantProfiles } = participantIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, full_name")
        .in("id", participantIds)
    : { data: [] as Array<{ id: string; nickname: string | null; full_name: string | null }> };

  const participantProfileMap = new Map((participantProfiles ?? []).map((item) => [item.id, item]));

  const isCreator = Boolean(user && session.created_by === user.id);
  const userIsParticipant = Boolean(participant);
  const participantCount = participants?.length ?? 0;
  const statusMessage = (() => {
    const raw = Array.isArray(paramsValue.status) ? paramsValue.status[0] : paramsValue.status;
    switch (raw) {
      case "criado":
        return "Treino criado com sucesso.";
      case "participou":
        return "Você entrou no treino com sucesso.";
      case "saida":
        return "Você saiu do treino.";
      case "cancelado":
        return "Treino cancelado.";
      case "atualizado":
        return "Treino atualizado com sucesso.";
      default:
        return "";
    }
  })();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">{session.title}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/treinos" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white">Voltar</Link>
            {isCreator ? <Link href={`/treino/${id}/editar`} className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Editar</Link> : null}
          </div>
        </div>

        {statusMessage ? (
          <div className="mb-6 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            {statusMessage}
          </div>
        ) : null}

        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">
              {session.training_type}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
              {STATUS_LABELS[session.status] ?? session.status}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-500">Nível</p><p className="mt-1 font-semibold text-white">{session.competitive_level || "—"}</p></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-500">Data</p><p className="mt-1 font-semibold text-white">{new Date(session.scheduled_at).toLocaleString("pt-BR")}</p></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-500">Duração</p><p className="mt-1 font-semibold text-white">{session.duration_minutes ? `${session.duration_minutes} min` : "—"}</p></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm text-zinc-500">Participantes</p><p className="mt-1 font-semibold text-white">{participantCount}/{session.max_participants}</p></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:col-span-2"><p className="text-sm text-zinc-500">Local</p><p className="mt-1 font-semibold text-white">{[session.city, session.state, session.region].filter(Boolean).join(" / ") || "—"}</p></div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Descrição</h2>
              <p className="text-sm leading-7 text-zinc-300">{session.description || "Sem descrição disponível."}</p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Time</h2>
              <p className="text-sm text-zinc-300">{session.team?.name || "Treino individual"}</p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Criado por</h2>
              <p className="text-sm text-zinc-300">{session.creator?.nickname || session.creator?.full_name || "Usuário"}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">Faça login para participar deste treino.</p>
                <Link href={`/login?next=${encodeURIComponent(`/treino/${id}`)}`} className="inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Entrar para participar</Link>
              </div>
            ) : isCreator ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">Você é o criador deste treino.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/treino/${id}/editar`} className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Editar treino</Link>
                  <form action={`/api/treinos/${id}`} method="POST">
                    <input type="hidden" name="action" value="cancel" />
                    <input type="hidden" name="next" value={`/treino/${id}`} />
                    <button type="submit" className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2 font-bold text-red-200">Cancelar treino</button>
                  </form>
                </div>
              </div>
            ) : userIsParticipant ? (
              <form action={`/api/treinos/${id}/sair`} method="POST" className="space-y-3">
                <p className="text-sm text-zinc-300">Você já participa deste treino.</p>
                <input type="hidden" name="next" value={`/treino/${id}`} />
                <button type="submit" className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2 font-bold text-red-200">Sair do treino</button>
              </form>
            ) : session.status === "open" ? (
              <form action={`/api/treinos/${id}/participar`} method="POST" className="space-y-3">
                <p className="text-sm text-zinc-300">Ainda há vagas disponíveis.</p>
                <input type="hidden" name="next" value={`/treino/${id}`} />
                <button type="submit" className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Participar do treino</button>
              </form>
            ) : (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                {session.status === "full" ? "Este treino está lotado." : session.status === "cancelled" ? "Este treino foi cancelado." : "Este treino foi concluído."}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">Participantes</h2>
            {!participants || participants.length === 0 ? (
              <p className="text-sm text-zinc-300">Ainda não há participantes confirmados.</p>
            ) : (
              <ul className="space-y-3">
                {participants.map((entry) => {
                  const profile = participantProfileMap.get(entry.player_id);

                  return (
                    <li key={entry.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
                      {profile?.nickname || profile?.full_name || "Jogador"}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

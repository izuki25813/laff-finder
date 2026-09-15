import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  full: "Lotado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

function escapeLikeValue(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export default async function TreinosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    notFound();
  }

  const paramsValue = (await searchParams) ?? {};
  const q = Array.isArray(paramsValue.q) ? paramsValue.q[0] ?? "" : paramsValue.q ?? "";
  const trainingType = Array.isArray(paramsValue.type) ? paramsValue.type[0] ?? "" : paramsValue.type ?? "";
  const competitiveLevel = Array.isArray(paramsValue.level) ? paramsValue.level[0] ?? "" : paramsValue.level ?? "";
  const region = Array.isArray(paramsValue.region) ? paramsValue.region[0] ?? "" : paramsValue.region ?? "";
  const state = Array.isArray(paramsValue.state) ? paramsValue.state[0] ?? "" : paramsValue.state ?? "";
  const city = Array.isArray(paramsValue.city) ? paramsValue.city[0] ?? "" : paramsValue.city ?? "";
  const status = Array.isArray(paramsValue.status) ? paramsValue.status[0] ?? "" : paramsValue.status ?? "";

  let query = supabase
    .from("training_sessions")
    .select("*, team:teams(id, name, tag), creator:profiles!created_by(id, nickname, full_name)")
    .order("scheduled_at", { ascending: true });

  if (q.trim()) {
    const safeValue = escapeLikeValue(q.trim());
    query = query.or(`title.ilike.%${safeValue}%,description.ilike.%${safeValue}%`);
  }

  if (trainingType) query = query.eq("training_type", trainingType);
  if (competitiveLevel) query = query.eq("competitive_level", competitiveLevel);
  if (region) query = query.eq("region", region);
  if (state) query = query.eq("state", state);
  if (city) query = query.eq("city", city);
  if (status) query = query.eq("status", status);

  const { data: sessions } = await query.limit(30);

  const ids = (sessions ?? []).map((item) => item.id);
  const { data: participants } = ids.length
    ? await supabase.from("training_participants").select("training_id").in("training_id", ids)
    : { data: [] as Array<{ training_id: string }> };

  const counts = new Map<string, number>();
  for (const participant of participants ?? []) {
    counts.set(participant.training_id, (counts.get(participant.training_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Treinos</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/treinos/novo" className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Criar treino</Link>
            <Link href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white">Dashboard</Link>
          </div>
        </div>

        <form method="GET" className="mb-8 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-6">
          <input name="q" defaultValue={q} placeholder="Buscar por título ou descrição" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white md:col-span-2" />
          <input name="type" defaultValue={trainingType} placeholder="Tipo" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
          <input name="level" defaultValue={competitiveLevel} placeholder="Nível" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
          <input name="region" defaultValue={region} placeholder="Região" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
          <input name="state" defaultValue={state} placeholder="Estado" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
          <input name="city" defaultValue={city} placeholder="Cidade" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
          <select name="status" defaultValue={status} className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white md:col-span-2">
            <option value="">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="full">Lotado</option>
            <option value="cancelled">Cancelado</option>
            <option value="completed">Concluído</option>
          </select>
          <button type="submit" className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black md:col-span-1">Filtrar</button>
        </form>

        {!sessions || sessions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
            Nenhum treino encontrado.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => {
              const participantCount = counts.get(session.id) ?? 0;
              const available = Math.max(session.max_participants - participantCount, 0);

              return (
                <article key={session.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">
                      {session.training_type}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                      {STATUS_LABELS[session.status] ?? session.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white">{session.title}</h2>
                  <p className="mt-2 text-sm text-zinc-300">{session.description || "Sem descrição."}</p>

                  <dl className="mt-4 space-y-2 text-sm text-zinc-300">
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Nível</dt><dd>{session.competitive_level || "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Quando</dt><dd>{new Date(session.scheduled_at).toLocaleString("pt-BR")}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Duração</dt><dd>{session.duration_minutes ? `${session.duration_minutes} min` : "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Local</dt><dd>{[session.city, session.state, session.region].filter(Boolean).join(" / ") || "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Participantes</dt><dd>{participantCount}/{session.max_participants}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Time</dt><dd>{session.team?.name || "—"}</dd></div>
                  </dl>

                  <Link href={`/treino/${session.id}`} className="mt-5 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                    {available > 0 ? "Ver treino" : "Ver detalhes"}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

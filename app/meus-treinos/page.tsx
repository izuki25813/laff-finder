import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  full: "Lotado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

export default async function MeusTreinosPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: createdSessions } = await supabase
    .from("training_sessions")
    .select("*, team:teams(id, name, tag)")
    .eq("created_by", profile.id)
    .order("scheduled_at", { ascending: true });

  const { data: participations } = await supabase
    .from("training_participants")
    .select("training_id")
    .eq("player_id", profile.id);

  const trainingIds = (participations ?? []).map((item) => item.training_id);
  const { data: joinedSessions } = trainingIds.length
    ? await supabase
        .from("training_sessions")
        .select("*, team:teams(id, name, tag)")
        .in("id", trainingIds)
        .order("scheduled_at", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Meus treinos</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/treinos/novo" className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">Novo treino</Link>
            <Link href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white">Dashboard</Link>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="mb-4 text-xl font-black text-yellow-400">Treinos criados</h2>
          {!createdSessions || createdSessions.length === 0 ? (
            <p className="text-zinc-300">Você ainda não criou treinos.</p>
          ) : (
            <div className="space-y-3">
              {createdSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{session.title}</p>
                      <p className="text-sm text-zinc-400">{session.training_type} · {session.team?.name || "Sem time"}</p>
                    </div>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                      {STATUS_LABELS[session.status] ?? session.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Link href={`/treino/${session.id}`} className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black text-black">Abrir</Link>
                    <Link href={`/treino/${session.id}/editar`} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-white">Editar</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="mb-4 text-xl font-black text-yellow-400">Participando</h2>
          {!joinedSessions || joinedSessions.length === 0 ? (
            <p className="text-zinc-300">Você ainda não participou de nenhum treino.</p>
          ) : (
            <div className="space-y-3">
              {joinedSessions.map((session) => (
                <div key={String(session.id)} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{String(session.title)}</p>
                      <p className="text-sm text-zinc-400">{String(session.training_type)} · {String((session as { team?: { name?: string } } )?.team?.name ?? "Sem time")}</p>
                    </div>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                      {STATUS_LABELS[String(session.status)] ?? String(session.status)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link href={`/treino/${String(session.id)}`} className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black text-black">Ver treino</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

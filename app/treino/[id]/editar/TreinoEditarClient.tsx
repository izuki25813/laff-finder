"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TRAINING_TYPE_OPTIONS, validateTrainingForm, normalizeTrainingForm, type TrainingSession } from "@/lib/training";

const fieldClass = "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400";

export default function TreinoEditarClient({
  initialSession,
  teams,
}: {
  initialSession: TrainingSession;
  teams: Array<{ id: string; name: string; tag: string | null }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => normalizeTrainingForm(initialSession));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const validationError = validateTrainingForm(form);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    const payload = new FormData();
    payload.set("action", "update");
    payload.set("title", form.title);
    payload.set("description", form.description);
    payload.set("training_type", form.training_type);
    payload.set("competitive_level", form.competitive_level);
    payload.set("region", form.region);
    payload.set("state", form.state);
    payload.set("city", form.city);
    payload.set("scheduled_at", form.scheduled_at);
    payload.set("duration_minutes", form.duration_minutes);
    payload.set("max_participants", form.max_participants);
    payload.set("team_id", form.team_id);
    payload.set("status", initialSession.status);
    payload.set("next", `/treino/${initialSession.id}`);

    const response = await fetch(`/api/treinos/${initialSession.id}`, {
      method: "POST",
      body: payload,
    });

    if (response.redirected) {
      router.push(response.url);
      return;
    }

    const text = await response.text();
    if (!response.ok) {
      setError(text || "Não foi possível atualizar o treino.");
      setSaving(false);
      return;
    }

    router.push(`/treino/${initialSession.id}`);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
            <h1 className="mt-2 text-3xl font-black">Editar treino</h1>
          </div>
          <Link href={`/treino/${initialSession.id}`} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold text-white">Voltar</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          {error ? <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Título *</span>
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} className={fieldClass} required />
              </label>
            </div>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Tipo *</span>
              <select value={form.training_type} onChange={(event) => updateField("training_type", event.target.value)} className={fieldClass}>
                {TRAINING_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Nível competitivo</span>
              <input value={form.competitive_level} onChange={(event) => updateField("competitive_level", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Data e horário *</span>
              <input type="datetime-local" value={form.scheduled_at} onChange={(event) => updateField("scheduled_at", event.target.value)} className={fieldClass} required />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Duração (min)</span>
              <input type="number" min="1" value={form.duration_minutes} onChange={(event) => updateField("duration_minutes", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Máx. participantes</span>
              <input type="number" min="1" value={form.max_participants} onChange={(event) => updateField("max_participants", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Região</span>
              <input value={form.region} onChange={(event) => updateField("region", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Estado</span>
              <input value={form.state} onChange={(event) => updateField("state", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Cidade</span>
              <input value={form.city} onChange={(event) => updateField("city", event.target.value)} className={fieldClass} />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300 md:col-span-2">
              <span className="font-medium">Time relacionado</span>
              <select value={form.team_id} onChange={(event) => updateField("team_id", event.target.value)} className={fieldClass}>
                <option value="">Sem time relacionado</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}{team.tag ? ` (${team.tag})` : ""}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300 md:col-span-2">
              <span className="font-medium">Descrição</span>
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={5} className={fieldClass} />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

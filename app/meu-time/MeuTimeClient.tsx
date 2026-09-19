"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EMPTY_TEAM_FORM, normalizeTeamForm, validateTeamForm, type TeamFormValues } from "@/lib/team";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400";

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm text-zinc-300">
      <span className="font-medium">{label}{required ? " *" : ""}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function MeuTimeClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamExists, setTeamExists] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamFormValues>(EMPTY_TEAM_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Configuração do Supabase não encontrada.");
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();

      if (loadError) {
        setError(loadError.message || "Não foi possível carregar o time.");
        setLoading(false);
        return;
      }

      if (data) {
        setTeamExists(true);
        setTeamId(data.id);
        setForm(normalizeTeamForm(data));
      }

      setLoading(false);
    };

    loadTeam();
  }, [userId]);

  const updateField = (field: keyof TeamFormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const validationError = validateTeamForm(form);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuração do Supabase não encontrada.");
      setSaving(false);
      return;
    }

    const payload = {
      owner_id: userId,
      name: form.name.trim(),
      tag: form.tag.trim(),
      logo_url: form.logo_url.trim(),
      description: form.description.trim(),
      region: form.region.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      competitive_level: form.competitive_level.trim(),
      main_game: form.main_game.trim() || "Free Fire",
      status: "active",
    };

    if (teamExists && teamId) {
      const { error: updateError } = await supabase.from("teams").update(payload).eq("id", teamId).eq("owner_id", userId);
      if (updateError) {
        setError(updateError.message || "Não foi possível atualizar o time.");
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("teams").insert({ ...payload, owner_id: userId });
      if (insertError) {
        setError(insertError.message || "Não foi possível criar o time.");
        setSaving(false);
        return;
      }
      setTeamExists(true);
    }

    setSuccess(teamExists ? "Time atualizado com sucesso." : "Time criado com sucesso.");
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-sm text-zinc-300">Carregando time...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">FINDER</p>
          <h1 className="mt-2 text-3xl font-black text-white">Meu Time</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
            Voltar ao dashboard
          </Link>
          <Link href="/meu-time/candidaturas" className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300">
            Candidaturas
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-green-500/50 bg-green-950/30 px-4 py-3 text-sm text-green-200">{success}</div>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Identidade</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nome do time" value={form.name} onChange={(value) => updateField("name", value)} placeholder="Ex: Furia LAFF" required />
            <InputField label="Tag" value={form.tag} onChange={(value) => updateField("tag", value)} placeholder="Ex: FUR" />
            <div className="md:col-span-2">
              <InputField label="Logo (URL)" value={form.logo_url} onChange={(value) => updateField("logo_url", value)} placeholder="https://..." />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Sobre</h2>
          <label className="block space-y-2 text-sm text-zinc-300">
            <span className="font-medium">Descrição</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={5}
              maxLength={500}
              className={fieldClass}
              placeholder="Conte sobre o estilo do time, objetivo e proposta."
            />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Localização</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <InputField label="Região" value={form.region} onChange={(value) => updateField("region", value)} placeholder="Brasil" />
            <InputField label="Estado" value={form.state} onChange={(value) => updateField("state", value)} placeholder="SP" />
            <InputField label="Cidade" value={form.city} onChange={(value) => updateField("city", value)} placeholder="São Paulo" />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Competitivo</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nível competitivo" value={form.competitive_level} onChange={(value) => updateField("competitive_level", value)} placeholder="Ex: Amador, Intermediário" />
            <InputField label="Jogo principal" value={form.main_game} onChange={(value) => updateField("main_game", value)} placeholder="Free Fire" />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Salvando..." : teamExists ? "Salvar alterações" : "Criar time"}
          </button>
        </div>
      </form>
    </div>
  );
}

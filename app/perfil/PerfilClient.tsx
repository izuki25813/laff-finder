"use client";

import Link from "next/link";
import { useState } from "react";

import {
  EXPERIENCE_OPTIONS,
  OBJECTIVE_OPTIONS,
  PLAYER_ROLE_OPTIONS,
  normalizePlayerProfile,
  validatePlayerProfile,
  type PlayerProfileFormValues,
} from "@/lib/player-profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400";

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-2 text-sm text-zinc-300">
      <span className="font-medium">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function PerfilClient({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Partial<PlayerProfileFormValues> | null;
}) {
  const [form, setForm] = useState<PlayerProfileFormValues>(normalizePlayerProfile(initialProfile));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = <K extends keyof PlayerProfileFormValues>(field: K, value: PlayerProfileFormValues[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const validationError = validatePlayerProfile({ ...form, id: userId });
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuração do Supabase não encontrada.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      id: userId,
      nickname: form.nickname.trim(),
      full_name: form.full_name.trim(),
      free_fire_id: form.free_fire_id.trim(),
      avatar_url: form.avatar_url.trim(),
      region: form.region.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      primary_role: form.primary_role.trim(),
      secondary_role: form.secondary_role.trim(),
      competitive_objective: form.competitive_objective.trim(),
      experience_level: form.experience_level.trim(),
      availability: form.availability.trim(),
      bio: form.bio.trim(),
      youtube_url: form.youtube_url.trim(),
      instagram_url: form.instagram_url.trim(),
      tiktok_url: form.tiktok_url.trim(),
      twitch_url: form.twitch_url.trim(),
      discord_username: form.discord_username.trim(),
    };

    const { error: upsertError } = await supabase.from("player_profiles").upsert(payload, {
      onConflict: "id",
    });

    if (upsertError) {
      setError(upsertError.message || "Não foi possível salvar o perfil.");
      setLoading(false);
      return;
    }

    setSuccess("Perfil salvo com sucesso.");
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
          <h1 className="mt-2 text-3xl font-black text-white">Perfil competitivo</h1>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/jogador/${userId}`}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400"
          >
            Ver perfil público
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-green-500/50 bg-green-950/30 px-4 py-3 text-sm text-green-200">
            {success}
          </div>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Identidade</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Nickname"
              value={form.nickname}
              onChange={(value) => updateField("nickname", value)}
              placeholder="Ex: FuriaNocturno"
              required
            />
            <InputField
              label="ID Free Fire"
              value={form.free_fire_id}
              onChange={(value) => updateField("free_fire_id", value)}
              placeholder="Ex: FF123456789"
            />
            <InputField
              label="Nome"
              value={form.full_name}
              onChange={(value) => updateField("full_name", value)}
              placeholder="Seu nome completo"
            />
            <InputField
              label="Foto (URL)"
              value={form.avatar_url}
              onChange={(value) => updateField("avatar_url", value)}
              placeholder="https://..."
              type="url"
            />
          </div>
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
            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Função principal</span>
              <select
                value={form.primary_role}
                onChange={(event) => updateField("primary_role", event.target.value)}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                {PLAYER_ROLE_OPTIONS.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Função secundária</span>
              <select
                value={form.secondary_role}
                onChange={(event) => updateField("secondary_role", event.target.value)}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                {PLAYER_ROLE_OPTIONS.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Objetivo competitivo</span>
              <select
                value={form.competitive_objective}
                onChange={(event) => updateField("competitive_objective", event.target.value)}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                {OBJECTIVE_OPTIONS.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Nível de experiência</span>
              <select
                value={form.experience_level}
                onChange={(event) => updateField("experience_level", event.target.value)}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Disponibilidade</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Disponibilidade"
              value={form.availability}
              onChange={(value) => updateField("availability", value)}
              placeholder="Ex: Noites e finais de semana"
            />

            <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={form.looking_for_team}
                onChange={(event) => updateField("looking_for_team", event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-yellow-400 focus:ring-yellow-500"
              />
              Procurando equipe
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Sobre você</h2>
          <div className="space-y-4">
            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="font-medium">Bio</span>
              <textarea
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                rows={5}
                maxLength={400}
                className={fieldClass}
                placeholder="Conte um pouco sobre seu estilo de jogo e objetivos."
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Redes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="YouTube" value={form.youtube_url} onChange={(value) => updateField("youtube_url", value)} placeholder="https://youtube.com/@..." type="url" />
            <InputField label="Instagram" value={form.instagram_url} onChange={(value) => updateField("instagram_url", value)} placeholder="https://instagram.com/..." type="url" />
            <InputField label="TikTok" value={form.tiktok_url} onChange={(value) => updateField("tiktok_url", value)} placeholder="https://tiktok.com/@..." type="url" />
            <InputField label="Twitch" value={form.twitch_url} onChange={(value) => updateField("twitch_url", value)} placeholder="https://twitch.tv/..." type="url" />
            <div className="md:col-span-2">
              <InputField label="Discord" value={form.discord_username} onChange={(value) => updateField("discord_username", value)} placeholder="nome#1234" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}

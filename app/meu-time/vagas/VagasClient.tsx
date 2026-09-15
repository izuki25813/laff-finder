"use client";

import Link from "next/link";
import { useState } from "react";

import {
  EMPTY_VACANCY_FORM,
  VACANCY_ROLE_OPTIONS,
  normalizeVacancyForm,
  validateTeamVacancyForm,
  type TeamVacancy,
  type TeamVacancyFormValues,
} from "@/lib/team-vacancy";
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

export default function VagasClient({
  userId,
  initialTeamId,
  initialVacancies,
}: {
  userId: string;
  initialTeamId: string;
  initialVacancies: TeamVacancy[];
}) {
  const [teamId, setTeamId] = useState<string | null>(initialTeamId);
  const [vacancies, setVacancies] = useState<TeamVacancy[]>(initialVacancies);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamVacancyFormValues>(EMPTY_VACANCY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTeamAndVacancies = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuração do Supabase não encontrada.");
      return;
    }

    const targetTeamId = teamId ?? initialTeamId;
    const { data, error: loadError } = await supabase
      .from("team_vacancies")
      .select("*")
      .eq("team_id", targetTeamId)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message || "Não foi possível carregar as vagas.");
      return;
    }

    setVacancies(data ?? []);
    setTeamId(targetTeamId);
  };

  const updateField = (field: keyof TeamVacancyFormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(EMPTY_VACANCY_FORM);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const validationError = validateTeamVacancyForm(form);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    if (!teamId) {
      setError("Time não encontrado.");
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
      team_id: teamId,
      created_by: userId,
      title: form.title.trim(),
      description: form.description.trim(),
      role: form.role.trim(),
      secondary_role: form.secondary_role.trim(),
      experience_level: form.experience_level.trim(),
      competitive_objective: form.competitive_objective.trim(),
      region: form.region.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      availability: form.availability.trim(),
      requirements: form.requirements.trim(),
      status: form.status,
    };

    if (selectedId) {
      const { error: updateError } = await supabase
        .from("team_vacancies")
        .update(payload)
        .eq("id", selectedId)
        .eq("team_id", teamId)
        .eq("created_by", userId);

      if (updateError) {
        setError(updateError.message || "Não foi possível atualizar a vaga.");
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("team_vacancies").insert(payload);
      if (insertError) {
        setError(insertError.message || "Não foi possível criar a vaga.");
        setSaving(false);
        return;
      }
    }

    setSuccess(selectedId ? "Vaga atualizada com sucesso." : "Vaga criada com sucesso.");
    resetForm();
    setSaving(false);
    await loadTeamAndVacancies();
  };

  const handleEdit = (vacancy: TeamVacancy) => {
    setSelectedId(vacancy.id);
    setForm(normalizeVacancyForm(vacancy));
  };

  const handleDelete = async (vacancyId: string) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuração do Supabase não encontrada.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("team_vacancies")
      .delete()
      .eq("id", vacancyId)
      .eq("team_id", teamId ?? initialTeamId)
      .eq("created_by", userId);

    if (deleteError) {
      setError(deleteError.message || "Não foi possível remover a vaga.");
      return;
    }

    setSuccess("Vaga removida com sucesso.");
    await loadTeamAndVacancies();
  };

  const handleStatusToggle = async (vacancyId: string, nextStatus: "open" | "closed") => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuração do Supabase não encontrada.");
      return;
    }

    const { error: toggleError } = await supabase
      .from("team_vacancies")
      .update({ status: nextStatus })
      .eq("id", vacancyId)
      .eq("team_id", teamId ?? initialTeamId)
      .eq("created_by", userId);

    if (toggleError) {
      setError(toggleError.message || "Não foi possível atualizar o status da vaga.");
      return;
    }

    setSuccess(nextStatus === "open" ? "Vaga reaberta." : "Vaga fechada.");
    await loadTeamAndVacancies();
  };

  if (!teamId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-zinc-300 md:px-6">
        <p>Você precisa criar um time antes de publicar vagas.</p>
        <Link href="/meu-time" className="mt-4 inline-flex rounded-xl bg-yellow-400 px-4 py-2 font-black text-black">
          Criar meu time
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">LAFF Finder</p>
          <h1 className="mt-2 text-3xl font-black text-white">Vagas do time</h1>
        </div>
        <Link href="/meu-time" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:border-yellow-500 hover:text-yellow-400">
          Voltar ao time
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">
            {selectedId ? "Editar vaga" : "Nova vaga"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? <div className="rounded-xl border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div> : null}
            {success ? <div className="rounded-xl border border-green-500/50 bg-green-950/30 px-4 py-3 text-sm text-green-200">{success}</div> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputField label="Título" value={form.title} onChange={(value) => updateField("title", value)} placeholder="Ex: Rusher para time competitivo" required />
              </div>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Função *</span>
                <select value={form.role} onChange={(event) => updateField("role", event.target.value)} className={fieldClass}>
                  <option value="">Selecione</option>
                  {VACANCY_ROLE_OPTIONS.map((option) => (
                    <option value={option} key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Função secundária</span>
                <select value={form.secondary_role} onChange={(event) => updateField("secondary_role", event.target.value)} className={fieldClass}>
                  <option value="">Selecione</option>
                  {VACANCY_ROLE_OPTIONS.map((option) => (
                    <option value={option} key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <InputField label="Nível" value={form.experience_level} onChange={(value) => updateField("experience_level", value)} placeholder="Ex: Intermediário" />
              <InputField label="Objetivo" value={form.competitive_objective} onChange={(value) => updateField("competitive_objective", value)} placeholder="Ex: Jogar campeonatos" />
              <InputField label="Disponibilidade" value={form.availability} onChange={(value) => updateField("availability", value)} placeholder="Noites e fins de semana" />
              <label className="block space-y-2 text-sm text-zinc-300">
                <span className="font-medium">Status</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className={fieldClass}>
                  <option value="open">Aberta</option>
                  <option value="closed">Fechada</option>
                </select>
              </label>
              <InputField label="Região" value={form.region} onChange={(value) => updateField("region", value)} placeholder="Brasil" />
              <InputField label="Estado" value={form.state} onChange={(value) => updateField("state", value)} placeholder="SP" />
              <InputField label="Cidade" value={form.city} onChange={(value) => updateField("city", value)} placeholder="São Paulo" />

              <div className="md:col-span-2">
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span className="font-medium">Descrição</span>
                  <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} maxLength={1000} className={fieldClass} placeholder="Descreva o que o time procura." />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block space-y-2 text-sm text-zinc-300">
                  <span className="font-medium">Requisitos</span>
                  <textarea value={form.requirements} onChange={(event) => updateField("requirements", event.target.value)} rows={4} maxLength={1000} className={fieldClass} placeholder="Ex: microfone, boa comunicação, disponibilidade de treino." />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Salvando..." : selectedId ? "Salvar alterações" : "Criar vaga"}
              </button>
              {selectedId ? (
                <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-bold text-white">
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-[0.2em] text-yellow-400">Minhas vagas</h2>
          {vacancies.length === 0 ? (
            <p className="text-sm text-zinc-300">Ainda não há vagas para este time.</p>
          ) : (
            <div className="space-y-3">
              {vacancies.map((vacancy) => (
                <div key={vacancy.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{vacancy.title}</p>
                      <p className="text-xs text-zinc-400">{vacancy.role} · {vacancy.status}</p>
                    </div>
                    <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                      {vacancy.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-zinc-300">
                    <p>{vacancy.experience_level || "Nível não informado"}</p>
                    <p>{vacancy.region || "Região não informada"}</p>
                    <p>{vacancy.availability || "Disponibilidade não informada"}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(vacancy)} className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black text-black">
                      Editar
                    </button>
                    <button type="button" onClick={() => handleStatusToggle(vacancy.id, vacancy.status === "open" ? "closed" : "open")} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-white">
                      {vacancy.status === "open" ? "Fechar" : "Abrir"}
                    </button>
                    <button type="button" onClick={() => handleDelete(vacancy.id)} className="rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-2 text-xs font-bold text-red-200">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

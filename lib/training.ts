export type TrainingSession = {
  id: string;
  created_by: string;
  team_id: string | null;
  title: string;
  description: string | null;
  training_type: string;
  competitive_level: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  max_participants: number;
  status: string;
  created_at: string;
  updated_at: string;
  team?: { id: string; name: string; tag: string | null } | null;
  creator?: { id: string; full_name: string | null; nickname: string | null } | null;
};

export type TrainingParticipant = {
  id: string;
  training_id: string;
  player_id: string;
  created_at: string;
  profile?: { id: string; full_name: string | null; nickname: string | null } | null;
};

export type TrainingSessionFormValues = {
  title: string;
  description: string;
  training_type: string;
  competitive_level: string;
  region: string;
  state: string;
  city: string;
  scheduled_at: string;
  duration_minutes: string;
  max_participants: string;
  team_id: string;
};

export const TRAINING_TYPE_OPTIONS = ["Treino", "Scrim", "Review", "Clash", "Desenvolvimento"] as const;

export const EMPTY_TRAINING_FORM: TrainingSessionFormValues = {
  title: "",
  description: "",
  training_type: "Treino",
  competitive_level: "",
  region: "",
  state: "",
  city: "",
  scheduled_at: "",
  duration_minutes: "",
  max_participants: "4",
  team_id: "",
};

export function normalizeTrainingForm(training?: Partial<TrainingSession> | null): TrainingSessionFormValues {
  return {
    title: training?.title ?? "",
    description: training?.description ?? "",
    training_type: training?.training_type ?? "Treino",
    competitive_level: training?.competitive_level ?? "",
    region: training?.region ?? "",
    state: training?.state ?? "",
    city: training?.city ?? "",
    scheduled_at: training?.scheduled_at ? new Date(training.scheduled_at).toISOString().slice(0, 16) : "",
    duration_minutes: training?.duration_minutes ? String(training.duration_minutes) : "",
    max_participants: training?.max_participants ? String(training.max_participants) : "4",
    team_id: training?.team_id ?? "",
  };
}

export function validateTrainingForm(values: TrainingSessionFormValues) {
  if (!values.title.trim()) {
    return "Título do treino é obrigatório.";
  }

  if (!values.training_type.trim()) {
    return "Tipo de treino é obrigatório.";
  }

  if (!values.scheduled_at) {
    return "Data e horário do treino são obrigatórios.";
  }

  const scheduledDate = new Date(values.scheduled_at);
  if (Number.isNaN(scheduledDate.getTime())) {
    return "Data e horário inválidos.";
  }

  const durationMinutes = values.duration_minutes.trim();
  if (durationMinutes && Number(durationMinutes) <= 0) {
    return "Duração deve ser maior que zero.";
  }

  const maxParticipants = Number(values.max_participants);
  if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
    return "Máximo de participantes deve ser maior que zero.";
  }

  return "";
}

export function formatTrainingDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

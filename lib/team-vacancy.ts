export type TeamVacancy = {
  id: string;
  team_id: string;
  created_by: string;
  title: string;
  description: string | null;
  role: string;
  secondary_role: string | null;
  experience_level: string | null;
  competitive_objective: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  availability: string | null;
  requirements: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TeamVacancyFormValues = {
  title: string;
  description: string;
  role: string;
  secondary_role: string;
  experience_level: string;
  competitive_objective: string;
  region: string;
  state: string;
  city: string;
  availability: string;
  requirements: string;
  status: string;
};

export const VACANCY_ROLE_OPTIONS = ["Rusher", "Suporte", "IGL", "Granadeiro", "Flex"] as const;

export const EMPTY_VACANCY_FORM: TeamVacancyFormValues = {
  title: "",
  description: "",
  role: "",
  secondary_role: "",
  experience_level: "",
  competitive_objective: "",
  region: "",
  state: "",
  city: "",
  availability: "",
  requirements: "",
  status: "open",
};

export function normalizeVacancyForm(vacancy?: Partial<TeamVacancy> | null): TeamVacancyFormValues {
  return {
    title: vacancy?.title ?? "",
    description: vacancy?.description ?? "",
    role: vacancy?.role ?? "",
    secondary_role: vacancy?.secondary_role ?? "",
    experience_level: vacancy?.experience_level ?? "",
    competitive_objective: vacancy?.competitive_objective ?? "",
    region: vacancy?.region ?? "",
    state: vacancy?.state ?? "",
    city: vacancy?.city ?? "",
    availability: vacancy?.availability ?? "",
    requirements: vacancy?.requirements ?? "",
    status: vacancy?.status ?? "open",
  };
}

export function validateTeamVacancyForm(values: TeamVacancyFormValues) {
  if (!values.title.trim()) {
    return "Título da vaga é obrigatório.";
  }

  if (values.title.trim().length < 5 || values.title.trim().length > 80) {
    return "Título da vaga deve ter entre 5 e 80 caracteres.";
  }

  if (!values.role.trim()) {
    return "Função é obrigatória.";
  }

  if (values.description.trim().length > 1000) {
    return "Descrição deve ter no máximo 1000 caracteres.";
  }

  if (values.requirements.trim().length > 1000) {
    return "Requisitos devem ter no máximo 1000 caracteres.";
  }

  return "";
}

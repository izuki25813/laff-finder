export type Team = {
  id: string;
  owner_id: string;
  name: string;
  tag: string | null;
  logo_url: string | null;
  description: string | null;
  region: string | null;
  state: string | null;
  city: string | null;
  competitive_level: string | null;
  main_game: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TeamFormValues = {
  name: string;
  tag: string;
  logo_url: string;
  description: string;
  region: string;
  state: string;
  city: string;
  competitive_level: string;
  main_game: string;
};

export const EMPTY_TEAM_FORM: TeamFormValues = {
  name: "",
  tag: "",
  logo_url: "",
  description: "",
  region: "",
  state: "",
  city: "",
  competitive_level: "",
  main_game: "Free Fire",
};

export function normalizeTeamForm(team?: Partial<Team> | null): TeamFormValues {
  return {
    name: team?.name ?? "",
    tag: team?.tag ?? "",
    logo_url: team?.logo_url ?? "",
    description: team?.description ?? "",
    region: team?.region ?? "",
    state: team?.state ?? "",
    city: team?.city ?? "",
    competitive_level: team?.competitive_level ?? "",
    main_game: team?.main_game ?? "Free Fire",
  };
}

export function validateTeamForm(values: TeamFormValues) {
  if (!values.name.trim()) {
    return "Nome do time é obrigatório.";
  }

  if (values.name.trim().length < 2 || values.name.trim().length > 50) {
    return "Nome do time deve ter entre 2 e 50 caracteres.";
  }

  if (values.tag.trim().length > 10) {
    return "Tag deve ter no máximo 10 caracteres.";
  }

  if (values.description.trim().length > 500) {
    return "Descrição deve ter no máximo 500 caracteres.";
  }

  if (values.logo_url.trim()) {
    try {
      const parsed = new URL(values.logo_url.trim());
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Invalid URL");
      }
    } catch {
      return "Logo deve ser uma URL válida.";
    }
  }

  return "";
}

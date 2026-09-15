export type PlayerProfileFormValues = {
  id: string;
  nickname: string;
  free_fire_id: string;
  full_name: string;
  avatar_url: string;
  region: string;
  state: string;
  city: string;
  primary_role: string;
  secondary_role: string;
  competitive_objective: string;
  experience_level: string;
  availability: string;
  looking_for_team: boolean;
  bio: string;
  youtube_url: string;
  instagram_url: string;
  tiktok_url: string;
  twitch_url: string;
  discord_username: string;
};

export const PLAYER_ROLE_OPTIONS = ["Rusher", "Suporte", "IGL", "Granadeiro", "Flex"] as const;
export const EXPERIENCE_OPTIONS = ["Iniciante", "Intermediário", "Avançado", "Competitivo"] as const;
export const OBJECTIVE_OPTIONS = [
  "Encontrar time",
  "Jogar campeonatos",
  "Virar profissional",
  "Evoluir competitivamente",
  "Jogar por diversão",
] as const;

export const EMPTY_PLAYER_PROFILE: PlayerProfileFormValues = {
  id: "",
  nickname: "",
  free_fire_id: "",
  full_name: "",
  avatar_url: "",
  region: "",
  state: "",
  city: "",
  primary_role: "",
  secondary_role: "",
  competitive_objective: "",
  experience_level: "",
  availability: "",
  looking_for_team: false,
  bio: "",
  youtube_url: "",
  instagram_url: "",
  tiktok_url: "",
  twitch_url: "",
  discord_username: "",
};

export function normalizePlayerProfile(profile?: Partial<PlayerProfileFormValues> | null): PlayerProfileFormValues {
  const base = { ...EMPTY_PLAYER_PROFILE };

  if (!profile) {
    return base;
  }

  return {
    ...base,
    ...profile,
    looking_for_team: Boolean(profile.looking_for_team),
  };
}

export function validatePlayerProfile(profile: PlayerProfileFormValues) {
  const nickname = profile.nickname.trim();
  if (!nickname) {
    return "Nickname é obrigatório.";
  }
  if (nickname.length < 3 || nickname.length > 32) {
    return "Nickname deve ter entre 3 e 32 caracteres.";
  }

  if (profile.free_fire_id.trim()) {
    const ffId = profile.free_fire_id.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,19}$/.test(ffId)) {
      return "ID Free Fire inválido. Use apenas letras, números, pontos, underline ou hífen.";
    }
  }

  const urlFields = [
    ["youtube_url", profile.youtube_url],
    ["instagram_url", profile.instagram_url],
    ["tiktok_url", profile.tiktok_url],
    ["twitch_url", profile.twitch_url],
  ] as const;

  for (const [fieldName, value] of urlFields) {
    if (!value || !value.trim()) continue;

    try {
      const parsed = new URL(value.trim());
      if (!parsed.protocol.startsWith("http")) {
        return `${fieldName.replace("_url", "")} deve ser uma URL válida.`;
      }
    } catch {
      return `${fieldName.replace("_url", "")} deve ser uma URL válida.`;
    }
  }

  if (profile.bio.trim().length > 400) {
    return "Bio deve ter no máximo 400 caracteres.";
  }

  if (profile.avatar_url.trim()) {
    try {
      const parsed = new URL(profile.avatar_url.trim());
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Invalid URL");
      }
    } catch {
      return "URL da foto deve ser válida.";
    }
  }

  return "";
}

export type DiagnosticRequestStatus = "pending" | "awaiting_info" | "in_review" | "completed" | "cancelled";

export type DiagnosticRequestRow = {
  id: string;
  enrollment_id: string;
  student_id: string;
  mentor_id: string | null;
  gameplay_url: string | null;
  gameplay_title: string | null;
  context: string | null;
  status: DiagnosticRequestStatus;
  result: unknown;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type DiagnosticResult = {
  strengths?: string[];
  main_errors?: string[];
  decision_making?: string;
  positioning?: string;
  game_reading?: string;
  exercises?: string[];
  checklist?: string[];
  final_diagnostic?: string;
};

export const DIAGNOSTIC_STATUS_LABELS: Record<DiagnosticRequestStatus, string> = {
  pending: "Aguardando envio do gameplay",
  awaiting_info: "Aguardando mais informações",
  in_review: "Em análise",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : undefined;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/**
 * result vem do banco como jsonb (unknown/any no supabase-js). Essa função
 * tolera null, formato inesperado ou campos ausentes sem lançar exceção.
 */
export function parseDiagnosticResult(value: unknown): DiagnosticResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const result: DiagnosticResult = {
    strengths: asStringArray(raw.strengths),
    main_errors: asStringArray(raw.main_errors),
    decision_making: asNonEmptyString(raw.decision_making),
    positioning: asNonEmptyString(raw.positioning),
    game_reading: asNonEmptyString(raw.game_reading),
    exercises: asStringArray(raw.exercises),
    checklist: asStringArray(raw.checklist),
    final_diagnostic: asNonEmptyString(raw.final_diagnostic),
  };

  const hasAnyContent = Object.values(result).some((entry) => entry !== undefined);
  return hasAnyContent ? result : null;
}

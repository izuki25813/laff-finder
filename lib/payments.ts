import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Camada de LEITURA/RESOLUÇÃO comercial (Fase 10.1). Não existe aqui
// checkout, pagamento, gateway, SDK de pagamento ou cliente service role.
//
// price é a fonte de verdade comercial: vem sempre do banco (mentoring_products
// / mentoring_plans), nunca do cliente. Qualquer checkout futuro deve chamar
// exclusivamente as funções abaixo para saber o que cobrar — nunca aceitar
// price/amount/product_id/plan_id enviados pelo frontend.

export type MentoringProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  active: boolean;
  product_type: "diagnostic" | "mentoring";
};

export type MentoringPlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  active: boolean;
  tier: number;
  modality: "individual" | "collective";
  sessions_included: number | null;
  duration_days: number | null;
};

export type ResolveError = "not_found" | "inactive" | "unavailable";

export type ResolveResult<T> = { ok: true; data: T } | { ok: false; error: ResolveError };

/**
 * Resolve um produto comercial (hoje: só o diagnóstico) a partir do slug
 * público. A policy de RLS "mentoring_products_select_public_active" já
 * filtra linhas inativas para qualquer chamador não-admin, então na
 * prática um slug inativo chega aqui como "not_found" (nenhuma linha
 * retornada pelo banco). O branch "inactive" só é alcançável quando o
 * chamador for ADMIN (a policy de admin enxerga linhas inativas também) —
 * mantido por segurança em profundidade, não como caminho principal.
 */
export async function resolveProductBySlug(slug: string): Promise<ResolveResult<MentoringProductRow>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await supabase
    .from("mentoring_products")
    .select("id, slug, name, description, price, currency, active, product_type")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringProductRow };
}

/**
 * Resolve um plano de mentoria a partir do slug público. Mesma lógica de
 * ativo/inativo do resolveProductBySlug acima.
 */
export async function resolvePlanBySlug(slug: string): Promise<ResolveResult<MentoringPlanRow>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await supabase
    .from("mentoring_plans")
    .select("id, slug, name, description, price, currency, active, tier, modality, sessions_included, duration_days")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringPlanRow };
}

/**
 * Resolve um produto comercial pelo id (uuid) real do banco. Usado pelo
 * checkout (Fase 10.4), que recebe product_id/plan_id a partir de uma
 * mentorship_enrollment já validada — nunca a partir do cliente. Mesma
 * lógica de ativo/inativo de resolveProductBySlug.
 */
export async function resolveProductById(id: string): Promise<ResolveResult<MentoringProductRow>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await supabase
    .from("mentoring_products")
    .select("id, slug, name, description, price, currency, active, product_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringProductRow };
}

/**
 * Resolve um plano de mentoria pelo id (uuid) real do banco. Mesmo uso e
 * lógica de resolveProductById acima.
 */
export async function resolvePlanById(id: string): Promise<ResolveResult<MentoringPlanRow>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await supabase
    .from("mentoring_plans")
    .select("id, slug, name, description, price, currency, active, tier, modality, sessions_included, duration_days")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringPlanRow };
}

/**
 * Versão administrativa (service role) que bypassa RLS.
 * Usada pelo checkout Mercado Pago que já opera com admin client.
 */
export async function resolveProductByIdAdmin(id: string): Promise<ResolveResult<MentoringProductRow>> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await admin
    .from("mentoring_products")
    .select("id, slug, name, description, price, currency, active, product_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringProductRow };
}

/**
 * Versão administrativa (service role) que bypassa RLS.
 * Usada pelo checkout Mercado Pago que já opera com admin client.
 */
export async function resolvePlanByIdAdmin(id: string): Promise<ResolveResult<MentoringPlanRow>> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await admin
    .from("mentoring_plans")
    .select("id, slug, name, description, price, currency, active, tier, modality, sessions_included, duration_days")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "not_found" };
  }

  if (!data.active) {
    return { ok: false, error: "inactive" };
  }

  return { ok: true, data: data as MentoringPlanRow };
}

// =========================================================
// Tipos da Fase 10.2 (public.payments)
// =========================================================
// Apenas tipos — nenhuma função nova de leitura/escrita de payments é
// adicionada aqui ainda (não existe checkout nesta fase). PaymentRow
// espelha exatamente o retorno de public.get_my_payments() (função
// SECURITY DEFINER no banco): de propósito, não inclui student_id,
// idempotency_key, gateway_preference_id nem raw_webhook_payload — esses
// campos nunca são expostos a um usuário comum, nem no banco nem aqui.

export type PaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "partially_refunded"
  | "chargeback";

export type PaymentRow = {
  id: string;
  enrollment_id: string;
  product_id: string | null;
  plan_id: string | null;
  gateway: string;
  gateway_payment_id: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  amount: number;
  currency: string;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  refunded_at: string | null;
  expires_at: string | null;
};

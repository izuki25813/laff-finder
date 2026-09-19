import "server-only";

import { randomUUID } from "node:crypto";

import { Preference } from "mercadopago";

import { getMercadoPagoClient } from "@/lib/mercado-pago";
import { resolvePlanById, resolveProductById } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Orquestração do checkout Mercado Pago (Fase 10.4): cria/recupera um
// payment pending para uma mentorship_enrollment pending já pertencente
// ao usuário autenticado, e cria (ou reaproveita) uma Preference do
// Checkout Pro para ele.
//
// NÃO marca payment como approved. NÃO ativa enrollment. Isso continua
// dependendo exclusivamente do webhook confirmado + mark_payment_approved().

export type CheckoutErrorCode =
  | "unauthenticated"
  | "not_found"
  | "not_pending"
  | "product_unavailable"
  | "app_url_missing"
  | "gateway_error"
  | "persist_error"
  | "unavailable";

export type CheckoutSuccess = {
  success: true;
  initPoint: string;
  preferenceId: string;
  paymentId: string;
};

export type CheckoutFailure = {
  success: false;
  error: CheckoutErrorCode;
  message: string;
};

export type CheckoutResult = CheckoutSuccess | CheckoutFailure;

type PendingPaymentRow = {
  id: string;
  amount: number;
  gateway_preference_id: string | null;
};

const GATEWAY = "mercado_pago";

/**
 * Cria (ou retoma) o checkout Mercado Pago para uma matrícula pending.
 *
 * `userId` precisa já ter sido resolvido pelo chamador a partir de uma
 * sessão autenticada real (nunca de um valor enviado pelo cliente).
 * Nenhum outro dado de entrada é aceito: preço, produto, plano, moeda e
 * student_id são sempre resolvidos aqui a partir do banco.
 */
export async function createMercadoPagoCheckout(userId: string, enrollmentId: string): Promise<CheckoutResult> {
  if (!userId) {
    return fail("unauthenticated", "Usuário não autenticado.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Deliberadamente NÃO reaproveitamos lib/config.ts (APP_URL), que tem
  // fallback silencioso para http://localhost:3000: para as back_urls do
  // checkout, um fallback implícito seria exatamente o tipo de "solução
  // insegura" que não deve existir aqui. A URL precisa ser configurada
  // explicitamente (mesmo que, em desenvolvimento, o valor configurado
  // seja localhost — isso é uma escolha explícita do desenvolvedor, não
  // um fallback nosso).
  if (!appUrl) {
    return fail(
      "app_url_missing",
      "NEXT_PUBLIC_APP_URL precisa estar configurado para iniciar o checkout.",
    );
  }

  // Usa admin client (service role) para buscar a matrícula, ignorando RLS.
  // A validação de ownership (student_id === userId) é feita no código abaixo,
  // garantindo segurança sem depender de política de linha.
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return fail("unavailable", "Integração de pagamento indisponível no momento.");
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("mentorship_enrollments")
    .select("id, student_id, status, product_id, plan_id")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (enrollmentError || !enrollment || enrollment.student_id !== userId) {
    return fail("not_found", "Matrícula não encontrada.");
  }

  if (enrollment.status !== "pending") {
    return fail("not_pending", "Esta matrícula não está com status pending.");
  }

  const resolved = enrollment.product_id
    ? await resolveProductById(enrollment.product_id)
    : enrollment.plan_id
      ? await resolvePlanById(enrollment.plan_id)
      : null;

  if (!resolved || !resolved.ok) {
    return fail("product_unavailable", "Produto/plano indisponível para cobrança.");
  }

  const resolvedPrice = Number(resolved.data.price);
  if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
    return fail("product_unavailable", "Produto/plano sem preço válido.");
  }

  // Reaproveita uma tentativa pending/processing existente para este
  // enrollment em vez de criar um payment novo a cada clique/retry/duplo
  // clique. "pending"/"processing" são os dois estados operacionais que
  // o índice único parcial idx_payments_unique_operational_per_enrollment
  // (correção pós-Fase 10.4) trata como mutuamente exclusivos por
  // matrícula.
  const { data: existingPayments } = await admin
    .from("payments")
    .select("id, amount, gateway_preference_id")
    .eq("enrollment_id", enrollmentId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1);

  let payment: PendingPaymentRow | null = (existingPayments?.[0] as PendingPaymentRow | undefined) ?? null;

  if (payment?.gateway_preference_id) {
    const reusedInitPoint = await fetchExistingInitPoint(payment.gateway_preference_id);
    if (reusedInitPoint) {
      return {
        success: true,
        initPoint: reusedInitPoint,
        preferenceId: payment.gateway_preference_id,
        paymentId: payment.id,
      };
    }
    // Preferência antiga não pôde ser recuperada no Mercado Pago (ex.:
    // expirada) — segue para criar uma nova preferência para o MESMO
    // payment, sem criar uma segunda linha em payments.
  }

  if (!payment) {
    const { data: inserted, error: insertError } = await admin
      .from("payments")
      .insert({
        student_id: userId,
        enrollment_id: enrollmentId,
        product_id: enrollment.product_id,
        plan_id: enrollment.plan_id,
        gateway: GATEWAY,
        idempotency_key: randomUUID(),
        amount: resolvedPrice,
        currency: "BRL",
        status: "pending",
      })
      .select("id, amount, gateway_preference_id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // Corrida: outra requisição concorrente criou o payment
        // pending/processing para este enrollment entre a busca acima e
        // este INSERT — o índice único parcial
        // idx_payments_unique_operational_per_enrollment barrou a
        // duplicata (isso é o esperado e correto). Reaproveita o payment
        // que venceu a corrida em vez de falhar.
        const { data: racedPayment } = await admin
          .from("payments")
          .select("id, amount, gateway_preference_id")
          .eq("enrollment_id", enrollmentId)
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!racedPayment) {
          logServerError("unique_violation ao criar payment, mas nenhum payment concorrente encontrado", insertError);
          return fail("persist_error", "Não foi possível iniciar o pagamento. Tente novamente.");
        }

        payment = racedPayment as PendingPaymentRow;
      } else {
        logServerError("falha ao criar payment", insertError);
        return fail("persist_error", "Não foi possível iniciar o pagamento. Tente novamente.");
      }
    } else if (inserted) {
      payment = inserted as PendingPaymentRow;
    } else {
      logServerError("insert de payment sem erro mas sem linha retornada", null);
      return fail("persist_error", "Não foi possível iniciar o pagamento. Tente novamente.");
    }
  }

  // Sempre usa o amount já persistido no payment (snapshot resolvido pelo
  // trigger no momento da criação), nunca um preço recalculado agora —
  // mesmo ao retomar um payment pending já existente.
  const itemAmount = Number(payment.amount);
  const itemTitle = resolved.data.name;

  let preferenceId: string;
  let initPoint: string;

  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: payment.id,
            title: itemTitle,
            quantity: 1,
            currency_id: "BRL",
            unit_price: itemAmount,
          },
        ],
        // Correlação com o payment interno: o webhook lê
        // external_reference do pagamento confirmado no Mercado Pago
        // para encontrar esta linha em public.payments.
        external_reference: payment.id,
        back_urls: {
          success: `${appUrl}/pagamento/sucesso`,
          failure: `${appUrl}/pagamento/falha`,
          pending: `${appUrl}/pagamento/pendente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercado-pago`,
      },
      requestOptions: {
        // Amarra a chamada ao Mercado Pago à nossa própria chave de
        // idempotência interna: uma repetição desta chamada (ex.: timeout
        // de rede seguido de retry) não cria uma segunda preferência.
        idempotencyKey: payment.id,
      },
    });

    if (!result.id || !result.init_point) {
      logServerError("resposta do Mercado Pago sem id/init_point", null);
      return fail("gateway_error", "Não foi possível iniciar o pagamento no Mercado Pago. Tente novamente.");
    }

    preferenceId = result.id;
    initPoint = result.init_point;
  } catch (error) {
    logServerError("erro ao criar preferência no Mercado Pago", error);
    return fail("gateway_error", "Não foi possível iniciar o pagamento no Mercado Pago. Tente novamente.");
  }

  const { error: updateError } = await admin
    .from("payments")
    .update({ gateway_preference_id: preferenceId })
    .eq("id", payment.id);

  if (updateError) {
    // A preferência já existe no Mercado Pago, mas não conseguimos
    // vincular gateway_preference_id ao payment interno. Não retornamos
    // sucesso: é mais seguro o aluno tentar de novo (uma nova tentativa
    // reaproveita este mesmo payment, que continua pending sem
    // gateway_preference_id) do que ele acreditar que o checkout está
    // pronto sem termos certeza do vínculo interno. A preferência criada
    // no Mercado Pago fica órfã (inofensiva: não é uma cobrança, apenas
    // um link de checkout não utilizado que expira sozinho).
    logServerError("falha ao salvar gateway_preference_id", updateError);
    return fail("persist_error", "Não foi possível concluir o início do pagamento. Tente novamente.");
  }

  return {
    success: true,
    initPoint,
    preferenceId,
    paymentId: payment.id,
  };
}

async function fetchExistingInitPoint(preferenceId: string): Promise<string | null> {
  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);
    const result = await preference.get({ preferenceId });
    return result.init_point ?? null;
  } catch (error) {
    logServerError("falha ao recuperar preferência existente", error);
    return null;
  }
}

function fail(error: CheckoutErrorCode, message: string): CheckoutFailure {
  return { success: false, error, message };
}

function logServerError(context: string, error: unknown) {
  // Só contexto + mensagem de erro (quando existir) vão para o log —
  // nunca o Access Token (que não aparece em erros do SDK) nem payloads
  // brutos de request/response.
  const detail = error instanceof Error ? error.message : error ? String(error) : "";
  console.error(`[mercado-pago-checkout] ${context}${detail ? `: ${detail}` : ""}`);
}

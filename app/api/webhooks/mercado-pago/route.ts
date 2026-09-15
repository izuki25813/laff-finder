import { NextResponse } from "next/server";

import {
  getMercadoPagoPayment,
  getMercadoPagoConfigSummary,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MercadoPagoWebhookPayload = {
  type?: unknown;
  action?: unknown;
  data?: { id?: unknown };
  id?: unknown;
  external_reference?: unknown;
  preference_id?: unknown;
  order_id?: unknown;
};

type ParsedWebhook = {
  payload: MercadoPagoWebhookPayload;
  eventType: string | null;
  action: string | null;
  paymentId: string | null;
  reference: string | null;
};

type InternalPayment = {
  id: string;
  enrollment_id: string;
  gateway: string;
  amount: number | string;
  currency: string;
  status: string;
};

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parsePayload(value: unknown): MercadoPagoWebhookPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as MercadoPagoWebhookPayload;
}

function parseWebhook(value: unknown, request: Request): ParsedWebhook | null {
  const payload = parsePayload(value);
  if (!payload) {
    return null;
  }

  const url = new URL(request.url);
  const eventType = asNonEmptyString(payload.type) ?? url.searchParams.get("type");
  const action = asNonEmptyString(payload.action) ?? url.searchParams.get("action");
  const paymentId =
    asNonEmptyString(payload.data?.id) ??
    url.searchParams.get("data.id") ??
    (eventType === "payment" ? asNonEmptyString(payload.id) : null);
  const reference =
    asNonEmptyString(payload.external_reference) ??
    asNonEmptyString(payload.preference_id) ??
    asNonEmptyString(payload.order_id);

  return { payload, eventType, action, paymentId, reference };
}

function isPaymentEvent(event: ParsedWebhook): boolean {
  return event.eventType === "payment" || event.action?.startsWith("payment.") === true;
}

function safeLog(
  event: ParsedWebhook,
  requestId: string | null,
  result: string,
  status: string | null = null,
) {
  console.info("[mercado-pago-webhook]", {
    result,
    eventType: event.eventType,
    action: event.action,
    paymentId: event.paymentId,
    status,
    referencePresent: Boolean(event.reference),
    requestId,
  });
}

function toCents(value: unknown): number | null {
  const normalized =
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : typeof value === "string" ? value.trim() : null;

  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}

export async function POST(request: Request) {
  if (!getMercadoPagoConfigSummary().hasWebhookSecret) {
    return NextResponse.json(
      { received: false, error: "webhook_unavailable" },
      { status: 503 },
    );
  }

  const requestId = request.headers.get("x-request-id");
  const xSignature = request.headers.get("x-signature");
  const url = new URL(request.url);
  const signatureDataId = url.searchParams.get("data.id");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { received: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { received: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const event = parseWebhook(parsedBody, request);
  if (!event) {
    return NextResponse.json(
      { received: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  try {
    if (!requestId) {
      throw new Error("x-request-id ausente.");
    }

    validateMercadoPagoWebhookSignature({
      xSignature,
      xRequestId: requestId,
      dataId: signatureDataId,
    });
  } catch {
    console.warn("[mercado-pago-webhook] assinatura rejeitada", { requestId });
    return NextResponse.json(
      { received: false, error: "invalid_signature" },
      { status: 401 },
    );
  }

  if (!isPaymentEvent(event)) {
    safeLog(event, requestId, "ignored_event");
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (!event.paymentId) {
    safeLog(event, requestId, "missing_payment_id");
    return NextResponse.json(
      { received: false, error: "missing_payment_id" },
      { status: 400 },
    );
  }

  let mercadoPagoPayment;
  try {
    mercadoPagoPayment = await getMercadoPagoPayment(event.paymentId);
  } catch {
    safeLog(event, requestId, "gateway_query_failed");
    return NextResponse.json(
      { received: false, error: "gateway_unavailable" },
      { status: 500 },
    );
  }

  const gatewayPaymentId = mercadoPagoPayment.id === undefined ? null : String(mercadoPagoPayment.id);
  const gatewayStatus = mercadoPagoPayment.status ?? null;
  const externalReference = mercadoPagoPayment.external_reference ?? null;

  if (!gatewayPaymentId || gatewayPaymentId !== event.paymentId) {
    safeLog(event, requestId, "gateway_payment_id_mismatch", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (!externalReference) {
    safeLog(event, requestId, "missing_external_reference", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    safeLog(event, requestId, "database_unavailable", gatewayStatus);
    return NextResponse.json(
      { received: false, error: "database_unavailable" },
      { status: 500 },
    );
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, enrollment_id, gateway, amount, currency, status")
    .eq("id", externalReference)
    .maybeSingle();

  if (paymentError) {
    safeLog(event, requestId, "database_query_failed", gatewayStatus);
    return NextResponse.json(
      { received: false, error: "database_unavailable" },
      { status: 500 },
    );
  }

  if (!payment) {
    safeLog(event, requestId, "internal_payment_not_found", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const internalPayment = payment as InternalPayment;
  const internalAmountCents = toCents(internalPayment.amount);
  const gatewayAmountCents = toCents(mercadoPagoPayment.transaction_amount);

  if (internalPayment.id !== externalReference || internalPayment.gateway !== "mercado_pago") {
    safeLog(event, requestId, "internal_payment_mismatch", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (
    internalPayment.currency !== "BRL" ||
    mercadoPagoPayment.currency_id !== "BRL" ||
    internalAmountCents === null ||
    gatewayAmountCents === null ||
    internalAmountCents !== gatewayAmountCents
  ) {
    safeLog(event, requestId, "amount_or_currency_mismatch", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (internalPayment.status === "approved") {
    safeLog(event, requestId, "already_processed", gatewayStatus);
    return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
  }

  if (internalPayment.status !== "pending" && internalPayment.status !== "processing") {
    safeLog(event, requestId, "internal_payment_not_operational", gatewayStatus);
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (gatewayStatus !== "approved") {
    safeLog(event, requestId, "payment_not_approved", gatewayStatus);
    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  }

  const { error: approvalError } = await admin.rpc("mark_payment_approved", {
    p_payment_id: internalPayment.id,
    p_gateway_payment_id: gatewayPaymentId,
    p_raw_webhook_payload: parsedBody,
  });

  if (approvalError) {
    safeLog(event, requestId, "approval_failed", gatewayStatus);
    return NextResponse.json(
      { received: false, error: "approval_unavailable" },
      { status: 500 },
    );
  }

  safeLog(event, requestId, "payment_approved", gatewayStatus);
  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
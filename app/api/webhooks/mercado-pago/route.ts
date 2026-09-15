import { NextResponse } from "next/server";

import {
  getMercadoPagoConfigSummary,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";

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

function safeLog(event: ParsedWebhook, requestId: string | null, result: string) {
  console.info("[mercado-pago-webhook]", {
    result,
    eventType: event.eventType,
    action: event.action,
    paymentId: event.paymentId,
    referencePresent: Boolean(event.reference),
    requestId,
  });
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

  // Fase 10.5A: a notificação é autenticada e classificada, mas não há
  // consulta server-side nem mutação de payment/enrollment nesta etapa.
  safeLog(event, requestId, "accepted_for_later_processing");
  return NextResponse.json(
    { received: true, accepted: true },
    { status: 202 },
  );
}
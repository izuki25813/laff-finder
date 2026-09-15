import "server-only";

import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from "mercadopago";

// Camada central server-only do Mercado Pago. Mantém a configuração do SDK
// oficial e a validação da assinatura do webhook fora das rotas públicas.
//
// "server-only" garante, em tempo de build, que este módulo nunca pode
// ser importado (direta ou transitivamente) por um Client Component: se
// isso acontecesse, o build do Next.js falharia com um erro explícito em
// vez de vazar MERCADO_PAGO_ACCESS_TOKEN para o bundle do navegador.

export type MercadoPagoConfigSummary = {
  hasAccessToken: boolean;
  hasPublicKey: boolean;
  hasWebhookSecret: boolean;
};

/**
 * Reporta quais variáveis de ambiente do Mercado Pago estão presentes,
 * sem nunca retornar os valores. Serve para diagnóstico/health-check sem
 * expor segredo nenhum — inclusive em logs, já que só booleans saem daqui.
 */
export function getMercadoPagoConfigSummary(): MercadoPagoConfigSummary {
  return {
    hasAccessToken: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    hasPublicKey: Boolean(process.env.MERCADO_PAGO_PUBLIC_KEY),
    hasWebhookSecret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
  };
}

export type MercadoPagoWebhookSignatureInput = {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
};

export function validateMercadoPagoWebhookSignature(input: MercadoPagoWebhookSignatureInput): void {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não está configurado.");
  }

  WebhookSignatureValidator.validate({
    xSignature: input.xSignature,
    xRequestId: input.xRequestId,
    dataId: input.dataId,
    secret,
    toleranceSeconds: 300,
  });
}

export async function getMercadoPagoPayment(paymentId: string) {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);

  return payment.get({ id: paymentId });
}

let cachedClient: MercadoPagoConfig | null = null;

/**
 * Inicializa (e reaproveita) o cliente oficial do Mercado Pago
 * (MercadoPagoConfig do pacote "mercadopago"). Não faz nenhuma chamada de
 * rede — só configura autenticação/timeout para uso pelo checkout e webhook.
 *
 * Lança um erro claro só quando é efetivamente CHAMADA sem
 * MERCADO_PAGO_ACCESS_TOKEN configurado. Nunca falha só por este módulo
 * ser importado, e nunca é chamada durante o build (nenhuma rota/página
 * desta fase a invoca) — então a ausência da credencial não quebra
 * `next build`.
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não está configurado. Defina essa variável de ambiente antes de usar a integração com o Mercado Pago.",
    );
  }

  if (!cachedClient) {
    cachedClient = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 },
    });
  }

  return cachedClient;
}

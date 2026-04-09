import { createHmac } from 'crypto';

// Documentação: https://www.mercadopago.com.br/developers/pt/docs/notifications/webhooks/security
//
// Header x-signature: "ts=1704908800,v1=abc123..."
// Header x-request-id: "uuid"
//
// Template para HMAC: "id:{data.id};request-id:{x-request-id};ts:{ts};"
// Algoritmo: HMAC-SHA256 com MERCADOPAGO_WEBHOOK_SECRET

export function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado');
    return false;
  }

  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => part.split('=') as [string, string])
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) return false;

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computed = createHmac('sha256', secret).update(template).digest('hex');

  return computed === v1;
}

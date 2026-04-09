import { Payment } from 'mercadopago';
import { mp } from '@/src/shared/mercadopago/client';
import { UpdatePedidoStatus } from '@/application/use-cases/UpdatePedidoStatus';
import { verifyWebhookSignature } from '@/src/shared/mercadopago/verifyWebhookSignature';

const updateStatus = new UpdatePedidoStatus();

// Mapeamento: status do MP → status interno do pedido.
// Statuses não mapeados são ignorados (ex: "in_process", "authorized").
const STATUS_MAP: Record<string, string> = {
  approved:  'pago',
  rejected:  'cancelado',
  cancelled: 'cancelado',
};

export async function POST(request: Request) {
  const xSignature = request.headers.get('x-signature') ?? '';
  const xRequestId = request.headers.get('x-request-id') ?? '';

  const body = await request.json();
  const dataId = String(body?.data?.id ?? '');

  // Rejeita notificações com assinatura inválida
  if (!verifyWebhookSignature(xSignature, xRequestId, dataId)) {
    console.warn('[Webhook MP] Assinatura inválida — request ignorado');
    return new Response(null, { status: 401 });
  }

  // Só processamos eventos de pagamento
  if (body.type !== 'payment' || !dataId) {
    return new Response(null, { status: 200 });
  }

  try {
    const payment = new Payment(mp);
    const paymentData = await payment.get({ id: dataId });

    const novoStatus = STATUS_MAP[paymentData.status ?? ''];
    const pedidoId = Number(paymentData.external_reference);

    if (!novoStatus || !pedidoId) {
      // Status intermediário (in_process etc.) — aguardar próxima notificação
      return new Response(null, { status: 200 });
    }

    await updateStatus.execute(pedidoId, novoStatus);

    console.info(
      `[Webhook MP] Pedido ${pedidoId} → ${novoStatus} (payment ${dataId})`
    );
  } catch (error) {
    // Retornar 500 faz o MP retentar — útil para falhas temporárias de banco
    console.error('[Webhook MP] Erro ao processar:', error);
    return new Response(null, { status: 500 });
  }

  // 200 confirma ao MP que a notificação foi processada
  return new Response(null, { status: 200 });
}

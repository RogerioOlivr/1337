import { Preference } from 'mercadopago';
import { mp } from '@/src/shared/mercadopago/client';
import { prisma } from '@/infra/database/prisma';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';
import { ConflictError } from '@/src/domain/errors/ConflictError';
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError';

export interface PreferenciaOutput {
  preferenceId: string;
  checkoutUrl: string;
}

export class CriarPreferenciaPagamento {
  async execute(pedidoId: number, usuarioId: number): Promise<PreferenciaOutput> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: {
          include: { produto: { select: { nome: true, imagem: true } } },
        },
      },
    });

    if (!pedido) throw new NotFoundError('Pedido não encontrado');
    if (pedido.usuarioId !== usuarioId) throw new UnauthorizedError();
    if (pedido.status !== 'pendente') {
      throw new ConflictError(
        `Não é possível iniciar pagamento de um pedido com status "${pedido.status}"`
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        // external_reference vincula a notificação do webhook ao nosso pedido
        external_reference: String(pedidoId),
        items: pedido.itens.map((item) => ({
          id: String(item.produtoId),
          title: item.produto.nome,
          picture_url: item.produto.imagem ?? undefined,
          quantity: item.quantidade,
          unit_price: item.precoUnit,
          currency_id: 'BRL',
        })),
        back_urls: {
          success: `${baseUrl}/pedidos/${pedidoId}?status=sucesso`,
          failure: `${baseUrl}/pedidos/${pedidoId}?status=falha`,
          pending: `${baseUrl}/pedidos/${pedidoId}?status=pendente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    });

    return {
      preferenceId: result.id!,
      checkoutUrl: result.init_point!,
    };
  }
}

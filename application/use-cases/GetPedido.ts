import { prisma } from '@/infra/database/prisma';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError';

export class GetPedido {
  async execute(pedidoId: number, usuarioId: number) {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: {
          include: {
            produto: { select: { nome: true, imagem: true } },
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundError('Pedido não encontrado');
    }

    // Garante que o usuário só acessa os próprios pedidos
    if (pedido.usuarioId !== usuarioId) {
      throw new UnauthorizedError();
    }

    return {
      id: pedido.id,
      status: pedido.status,
      total: pedido.total,
      createdAt: pedido.createdAt,
      itens: pedido.itens.map((i) => ({
        id: i.id,
        produtoId: i.produtoId,
        nomeProduto: i.produto.nome,
        imagemProduto: i.produto.imagem,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
        subtotal: i.precoUnit * i.quantidade,
      })),
    };
  }
}

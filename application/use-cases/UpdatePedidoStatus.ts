import { prisma } from '@/infra/database/prisma';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';
import { ConflictError } from '@/src/domain/errors/ConflictError';
import {
  type PedidoStatus,
  isValidStatus,
  isTransitionAllowed,
} from '@/src/domain/pedido/statusMachine';

export interface UpdatePedidoStatusOutput {
  id: number;
  status: string;
}

export class UpdatePedidoStatus {
  async execute(pedidoId: number, novoStatus: string): Promise<UpdatePedidoStatusOutput> {
    if (!isValidStatus(novoStatus)) {
      throw new ConflictError(`Status inválido: "${novoStatus}"`);
    }

    return prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      });

      if (!pedido) throw new NotFoundError('Pedido não encontrado');

      const statusAtual = pedido.status as PedidoStatus;

      if (!isTransitionAllowed(statusAtual, novoStatus)) {
        throw new ConflictError(
          `Transição inválida: "${statusAtual}" → "${novoStatus}"`
        );
      }

      // Devolve estoque ao cancelar — independente do status anterior
      if (novoStatus === 'cancelado') {
        await Promise.all(
          pedido.itens.map((item) =>
            tx.produto.update({
              where: { id: item.produtoId },
              data: { estoque: { increment: item.quantidade } },
            })
          )
        );
      }

      const atualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: novoStatus },
        select: { id: true, status: true },
      });

      return atualizado;
    });
  }
}

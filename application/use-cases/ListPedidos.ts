import { prisma } from '@/infra/database/prisma';

export interface PedidoSummary {
  id: number;
  status: string;
  total: number;
  quantidadeItens: number;
  createdAt: Date;
}

export class ListPedidos {
  async execute(usuarioId: number): Promise<PedidoSummary[]> {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        _count: { select: { itens: true } },
      },
    });

    return pedidos.map((p) => ({
      id: p.id,
      status: p.status,
      total: p.total,
      createdAt: p.createdAt,
      quantidadeItens: p._count.itens,
    }));
  }
}

import { prisma } from '@/infra/database/prisma';
import { createPedidoSchema, type CreatePedidoInput } from '../validators/createPedidoSchema';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';
import { ConflictError } from '@/src/domain/errors/ConflictError';

export interface ItemPedidoOutput {
  id: number;
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
}

export interface PedidoOutput {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  itens: ItemPedidoOutput[];
}

export class CreatePedido {
  async execute(input: CreatePedidoInput): Promise<PedidoOutput> {
    const { usuarioId, ...body } = input;

    const parsed = createPedidoSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message, parsed.error.issues);
    }

    const { itens } = parsed.data;
    const produtoIds = itens.map((i) => i.produtoId);

    return prisma.$transaction(async (tx) => {
      // Busca todos os produtos do pedido em uma única query
      const produtos = await tx.produto.findMany({
        where: { id: { in: produtoIds }, ativo: true },
        select: { id: true, nome: true, preco: true, estoque: true },
      });

      // Valida existência e estoque de cada item
      for (const item of itens) {
        const produto = produtos.find((p) => p.id === item.produtoId);

        if (!produto) {
          throw new NotFoundError(`Produto ${item.produtoId} não encontrado`);
        }

        if (produto.estoque < item.quantidade) {
          throw new ConflictError(
            `Estoque insuficiente para "${produto.nome}": disponível ${produto.estoque}, solicitado ${item.quantidade}`
          );
        }
      }

      const total = parseFloat(
        itens
          .reduce((acc, item) => {
            const produto = produtos.find((p) => p.id === item.produtoId)!;
            return acc + produto.preco * item.quantidade;
          }, 0)
          .toFixed(2)
      );

      // Cria o pedido e todos os itens
      const pedido = await tx.pedido.create({
        data: {
          usuarioId,
          total,
          status: 'pendente',
          itens: {
            create: itens.map((item) => {
              const produto = produtos.find((p) => p.id === item.produtoId)!;
              return {
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnit: produto.preco,
              };
            }),
          },
        },
        include: {
          itens: {
            include: {
              produto: { select: { nome: true } },
            },
          },
        },
      });

      // Decrementa o estoque de todos os produtos atomicamente
      await Promise.all(
        itens.map((item) =>
          tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { decrement: item.quantidade } },
          })
        )
      );

      return {
        id: pedido.id,
        status: pedido.status,
        total: pedido.total,
        createdAt: pedido.createdAt,
        itens: pedido.itens.map((i) => ({
          id: i.id,
          produtoId: i.produtoId,
          nomeProduto: i.produto.nome,
          quantidade: i.quantidade,
          precoUnit: i.precoUnit,
          subtotal: i.precoUnit * i.quantidade,
        })),
      };
    });
  }
}

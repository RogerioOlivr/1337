import { prisma } from '@/infra/database/prisma';

export interface ProdutoSummary {
  id: number;
  nome: string;
  preco: number;
  imagem: string | null;
  estoque: number;
}

export class ListProdutos {
  async execute(): Promise<ProdutoSummary[]> {
    return prisma.produto.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, preco: true, imagem: true, estoque: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import { prisma } from '@/infra/database/prisma';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';

export interface ProdutoDetail {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  estoque: number;
}

export class GetProduto {
  async execute(id: number): Promise<ProdutoDetail> {
    const produto = await prisma.produto.findUnique({
      where: { id, ativo: true },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        imagem: true,
        estoque: true,
      },
    });

    if (!produto) {
      throw new NotFoundError('Produto não encontrado');
    }

    return produto;
  }
}

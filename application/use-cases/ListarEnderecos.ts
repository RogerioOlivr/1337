import { prisma } from '@/infra/database/prisma'

export class ListarEnderecos {
  async execute(usuarioId: number) {
    return prisma.endereco.findMany({
      where: { usuarioId },
      orderBy: [{ padrao: 'desc' }, { createdAt: 'desc' }],
    })
  }
}

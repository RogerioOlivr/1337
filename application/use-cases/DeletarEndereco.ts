import { prisma } from '@/infra/database/prisma'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'
import { ConflictError } from '@/src/domain/errors/ConflictError'

export class DeletarEndereco {
  async execute(usuarioId: number, enderecoId: number): Promise<void> {
    const endereco = await prisma.endereco.findFirst({
      where: { id: enderecoId, usuarioId },
      include: { _count: { select: { pedidos: true } } },
    })

    if (!endereco) throw new NotFoundError('Endereço não encontrado.')

    if (endereco._count.pedidos > 0) {
      throw new ConflictError('Este endereço não pode ser removido pois está vinculado a pedidos.')
    }

    await prisma.endereco.delete({ where: { id: enderecoId } })

    // Se era o padrão, promove o mais recente
    if (endereco.padrao) {
      const proximo = await prisma.endereco.findFirst({
        where: { usuarioId },
        orderBy: { createdAt: 'desc' },
      })
      if (proximo) {
        await prisma.endereco.update({ where: { id: proximo.id }, data: { padrao: true } })
      }
    }
  }
}

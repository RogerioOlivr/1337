import { prisma } from '@/infra/database/prisma'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

export interface AtualizarEnderecoInput {
  usuarioId: number
  enderecoId: number
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  padrao?: boolean
}

export class AtualizarEndereco {
  async execute(input: AtualizarEnderecoInput) {
    const { usuarioId, enderecoId, padrao, ...campos } = input

    const endereco = await prisma.endereco.findFirst({
      where: { id: enderecoId, usuarioId },
    })

    if (!endereco) throw new NotFoundError('Endereço não encontrado.')

    const camposPreenchidos = Object.values(campos).filter(v => v !== undefined)
    if (padrao === undefined && camposPreenchidos.length === 0) {
      throw new ValidationError('Nenhum campo para atualizar.')
    }

    return prisma.$transaction(async (tx) => {
      if (padrao) {
        await tx.endereco.updateMany({
          where: { usuarioId, id: { not: enderecoId } },
          data: { padrao: false },
        })
      }

      return tx.endereco.update({
        where: { id: enderecoId },
        data: {
          ...Object.fromEntries(
            Object.entries(campos).filter(([, v]) => v !== undefined)
          ),
          ...(padrao !== undefined ? { padrao } : {}),
        },
      })
    })
  }
}

import { prisma } from '@/infra/database/prisma'

export interface SalvarEnderecoInput {
  usuarioId: number
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  padrao?: boolean
}

export class SalvarEndereco {
  async execute(input: SalvarEnderecoInput) {
    const { usuarioId, padrao = false, ...campos } = input

    return prisma.$transaction(async (tx) => {
      // Se este vai ser o padrão, remove o padrão dos outros
      if (padrao) {
        await tx.endereco.updateMany({
          where: { usuarioId },
          data: { padrao: false },
        })
      }

      return tx.endereco.create({
        data: { usuarioId, padrao, ...campos },
        select: {
          id: true,
          cep: true,
          logradouro: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          padrao: true,
        },
      })
    })
  }
}

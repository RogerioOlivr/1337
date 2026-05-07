import { prisma } from '@/infra/database/prisma'
import { ConflictError } from '@/src/domain/errors/ConflictError'
import { normalizeCPF } from './ResolverIdentidade'

export interface AtualizarPerfilInput {
  usuarioId: number
  nome?: string
  cpf?: string
  telefone?: string
}

export class AtualizarPerfil {
  async execute({ usuarioId, cpf, ...campos }: AtualizarPerfilInput) {
    const data: Record<string, unknown> = Object.fromEntries(
      Object.entries(campos).filter(([, v]) => v !== undefined)
    )

    if (cpf !== undefined) {
      const cpfNorm = normalizeCPF(cpf)

      if (cpfNorm) {
        // Verifica se o CPF já pertence a outro usuário
        const existente = await prisma.usuario.findUnique({
          where: { cpf: cpfNorm },
          select: { id: true },
        })

        if (existente && existente.id !== usuarioId) {
          throw new ConflictError('Este CPF já está vinculado a outra conta.')
        }

        data.cpf = cpfNorm
      } else {
        // CPF vazio → limpa o campo
        data.cpf = null
      }
    }

    return prisma.usuario.update({
      where: { id: usuarioId },
      data,
      select: { id: true, nome: true, email: true, cpf: true, telefone: true },
    })
  }
}

import { prisma } from '@/infra/database/prisma'

export interface AtualizarPerfilInput {
  usuarioId: number
  nome?: string
  cpf?: string
  telefone?: string
}

export class AtualizarPerfil {
  async execute({ usuarioId, ...campos }: AtualizarPerfilInput) {
    // Remove campos undefined para não sobrescrever com null
    const data = Object.fromEntries(
      Object.entries(campos).filter(([, v]) => v !== undefined)
    )

    return prisma.usuario.update({
      where: { id: usuarioId },
      data,
      select: { id: true, nome: true, email: true, cpf: true, telefone: true },
    })
  }
}

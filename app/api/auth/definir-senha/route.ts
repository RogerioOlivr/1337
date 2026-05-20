import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, novaSenha } = body

    if (!token || !novaSenha || typeof novaSenha !== 'string') {
      throw new ValidationError('Token e nova senha são obrigatórios.')
    }
    if (novaSenha.length < 8) {
      throw new ValidationError('A senha deve ter no mínimo 8 caracteres.')
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, usuarioId: true, expiresAt: true, usedAt: true },
    })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new NotFoundError('Link de definição de senha inválido ou expirado.')
    }

    const hash = await bcrypt.hash(novaSenha, 12)

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: record.usuarioId },
        data: { senha: hash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return ok({ message: 'Senha definida com sucesso.' })
  } catch (error) {
    return handleApiError(error)
  }
}

import crypto from 'crypto'
import { prisma } from '@/infra/database/prisma'
import { AppError } from '@/src/domain/errors/AppError'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export interface ValidateMagicLinkResult {
  id: number
  email: string
  nome: string
}

export class ValidateMagicLink {
  async execute(rawToken: string): Promise<ValidateMagicLinkResult> {
    if (!rawToken) throw new NotFoundError('Token inválido.')

    const hashedToken = hashToken(rawToken)

    const magicToken = await prisma.magicToken.findUnique({
      where: { token: hashedToken },
    })

    if (!magicToken) {
      throw new NotFoundError('Link de acesso inválido ou já utilizado.')
    }

    if (magicToken.usedAt) {
      throw new AppError('Este link já foi utilizado.', 400, 'TOKEN_ALREADY_USED')
    }

    if (new Date() > magicToken.expiresAt) {
      throw new AppError('Este link expirou. Solicite um novo.', 400, 'TOKEN_EXPIRED')
    }

    // Invalida o token (uso único)
    await prisma.magicToken.update({
      where: { token: hashedToken },
      data: { usedAt: new Date() },
    })

    const usuario = await prisma.usuario.findUnique({
      where: { email: magicToken.email, ativo: true },
      select: { id: true, email: true, nome: true },
    })

    if (!usuario) {
      throw new NotFoundError('Usuário não encontrado.')
    }

    return usuario
  }
}

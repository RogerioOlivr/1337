import crypto from 'crypto'
import { prisma } from '@/infra/database/prisma'
import { ValidationError } from '@/src/domain/errors/ValidationError'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

const MAX_ATTEMPTS = 5

function hashCode(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export interface VerifyOtpResult {
  id: number
  nome: string
  email: string
  role: string
}

export class VerifyOtpCode {
  async execute(email: string, code: string): Promise<VerifyOtpResult> {
    const otp = await prisma.otpCode.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      throw new ValidationError('Código inválido ou expirado. Solicite um novo.')
    }

    if (otp.tentativas >= MAX_ATTEMPTS) {
      throw new ValidationError('Número máximo de tentativas atingido. Solicite um novo código.')
    }

    const hashedInput = hashCode(code.trim())

    if (otp.code !== hashedInput) {
      // Incrementa tentativas sem invalidar o código ainda
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { tentativas: { increment: 1 } },
      })
      const restantes = MAX_ATTEMPTS - otp.tentativas - 1
      throw new ValidationError(
        restantes > 0
          ? `Código incorreto. ${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}.`
          : 'Código incorreto. Solicite um novo código.'
      )
    }

    // Marca como usado
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    })

    const usuario = await prisma.usuario.findUnique({
      where: { email, ativo: true },
      select: { id: true, nome: true, email: true, role: true },
    })

    if (!usuario) throw new NotFoundError('Conta não encontrada.')

    return usuario
  }
}

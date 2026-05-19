import { prisma } from '@/infra/database/prisma'
import { ValidationError } from '@/src/domain/errors/ValidationError'

export type CheckoutIdentificacao = 'existente' | 'novo'

export class VerificarEmailCheckout {
  async execute(email: string): Promise<{ tipo: CheckoutIdentificacao; email: string }> {
    const emailNorm = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      throw new ValidationError('Informe um e-mail válido.')
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    })

    return { tipo: usuario ? 'existente' : 'novo', email: emailNorm }
  }
}

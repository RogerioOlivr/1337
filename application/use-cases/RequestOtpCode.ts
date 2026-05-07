import crypto from 'crypto'
import { prisma } from '@/infra/database/prisma'
import { sendEmail } from '@/src/shared/email/sendEmail'
import { ValidationError } from '@/src/domain/errors/ValidationError'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

const TTL_MINUTES = 10
const MAX_REQUESTS_PER_HOUR = 5

function hashCode(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function generateOtp(): string {
  return String(Math.floor(100000 + crypto.randomInt(900000)))
}

export interface RequestOtpResult {
  email: string        // e-mail real (para o verify)
  emailMascarado: string // exibido na UI
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}

export class RequestOtpCode {
  async execute(identifier: string): Promise<RequestOtpResult> {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)

    const usuario = isEmail
      ? await prisma.usuario.findUnique({ where: { email: identifier } })
      : await prisma.usuario.findFirst({ where: { cpf: identifier, ativo: true } })

    if (!usuario) {
      throw new NotFoundError('Nenhuma conta encontrada com este e-mail ou CPF.')
    }

    // Rate limit: máximo de requisições por hora
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
    const recentes = await prisma.otpCode.count({
      where: { email: usuario.email, createdAt: { gte: umaHoraAtras } },
    })

    if (recentes >= MAX_REQUESTS_PER_HOUR) {
      throw new ValidationError('Muitas tentativas. Aguarde 1 hora para solicitar um novo código.')
    }

    // Invalida códigos anteriores não usados
    await prisma.otpCode.updateMany({
      where: { email: usuario.email, usedAt: null },
      data: { usedAt: new Date() },
    })

    const rawCode = generateOtp()
    const hashedCode = hashCode(rawCode)
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)

    await prisma.otpCode.create({
      data: { email: usuario.email, code: hashedCode, expiresAt },
    })

    await sendEmail({
      to: usuario.email,
      subject: `${rawCode} é seu código de acesso — 1337`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="font-size:24px;font-weight:700;letter-spacing:-0.5px">Seu código de acesso</h2>
          <p style="color:#555;margin-bottom:24px">Use o código abaixo para entrar na sua conta. Ele expira em ${TTL_MINUTES} minutos.</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:12px;padding:24px;background:#f4f4f4;text-align:center;font-family:monospace">
            ${rawCode}
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px">Se você não solicitou este código, ignore este e-mail.</p>
        </div>
      `,
    })

    // Em dev: log no console para facilitar testes
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP DEV] Código para ${usuario.email}: ${rawCode}`)
    }

    return { email: usuario.email, emailMascarado: maskEmail(usuario.email) }
  }
}

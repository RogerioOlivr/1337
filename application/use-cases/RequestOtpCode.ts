import crypto from 'crypto'
import { prisma } from '@/infra/database/prisma'
import { sendEmail } from '@/src/shared/email/sendEmail'
import { ValidationError } from '@/src/domain/errors/ValidationError'
import { ResolverIdentidade, type IdentidadeTipo } from './ResolverIdentidade'

const TTL_MINUTES = 10
const MAX_PER_HORA = 5

function hashCode(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000))
}

export interface RequestOtpResult {
  tipo: IdentidadeTipo
  email: string           // real (para o verify)
  emailMascarado: string  // para exibir na UI
  mensagem?: string       // contexto para o usuário
}

const resolver = new ResolverIdentidade()

export class RequestOtpCode {
  async execute(identifier: string): Promise<RequestOtpResult> {
    const identidade = await resolver.execute(identifier)

    // Não tem conta e não conseguimos resolver → retorna sem enviar código
    if (identidade.tipo === 'sem_conta') {
      return {
        tipo: 'sem_conta',
        email: '',
        emailMascarado: '',
        mensagem: identidade.mensagem,
      }
    }

    const { email, emailMascarado, mensagem } = identidade as Required<Pick<typeof identidade, 'email' | 'emailMascarado'>> & typeof identidade

    // Rate limit
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
    const recentes = await prisma.otpCode.count({
      where: { email, createdAt: { gte: umaHoraAtras } },
    })

    if (recentes >= MAX_PER_HORA) {
      throw new ValidationError('Muitas tentativas. Aguarde 1 hora para solicitar um novo código.')
    }

    // Invalida códigos anteriores não usados
    await prisma.otpCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    })

    const rawCode = generateOtp()
    const hashedCode = hashCode(rawCode)
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)

    await prisma.otpCode.create({
      data: { email, code: hashedCode, expiresAt },
    })

    await sendEmail({
      to: email,
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP DEV] ${email}: ${rawCode}`)
    }

    return {
      tipo: identidade.tipo,
      email,
      emailMascarado: emailMascarado!,
      mensagem,
    }
  }
}

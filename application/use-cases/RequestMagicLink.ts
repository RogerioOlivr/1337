import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { sendEmail } from '@/src/shared/email/sendEmail'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const TOKEN_TTL_MINUTES = 15

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function nomeFromEmail(email: string): string {
  // "joao.silva@gmail.com" → "Joao Silva"
  return email
    .split('@')[0]
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export interface RequestMagicLinkResult {
  /** Retornado APENAS em desenvolvimento para facilitar testes */
  magicLink?: string
}

export class RequestMagicLink {
  async execute(email: string, redirectTo = '/checkout'): Promise<RequestMagicLinkResult> {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('E-mail inválido.')
    }

    // Encontra ou cria usuário (sem exigir senha)
    let usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      // Cria conta automaticamente com senha aleatória (nunca será usada)
      const senhaAleatoria = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
      usuario = await prisma.usuario.create({
        data: {
          email,
          nome: nomeFromEmail(email),
          senha: senhaAleatoria,
        },
      })
    }

    // Invalida tokens anteriores não usados deste e-mail
    await prisma.magicToken.deleteMany({
      where: { email, usedAt: null },
    })

    // Gera token bruto seguro (256 bits de entropia)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.magicToken.create({
      data: { token: hashedToken, email, expiresAt },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verificar?token=${rawToken}&redirect=${encodeURIComponent(redirectTo)}`

    await sendEmail({
      to: email,
      subject: '🔑 Seu link de acesso — 1337',
      html: `
        <p>Olá,</p>
        <p>Clique no link abaixo para entrar na sua conta. O link expira em ${TOKEN_TTL_MINUTES} minutos e só pode ser usado uma vez.</p>
        <p><a href="${magicLink}" style="font-weight:bold">Acessar minha conta →</a></p>
        <p style="color:#999;font-size:12px">Se você não solicitou este link, ignore este e-mail.</p>
      `,
    })

    // Em desenvolvimento, retorna o link para facilitar testes sem e-mail real
    return process.env.NODE_ENV !== 'production' ? { magicLink } : {}
  }
}

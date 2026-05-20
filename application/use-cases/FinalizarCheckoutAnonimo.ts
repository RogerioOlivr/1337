import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { ConflictError } from '@/src/domain/errors/ConflictError'
import { normalizeCPF } from './ResolverIdentidade'
import { sendEmail } from '@/src/shared/email/sendEmail'
import { emailContaCriadaCheckout } from '@/src/shared/email/templates/contaCriadaCheckout'

export interface FinalizarCheckoutInput {
  email: string
  nome: string
  telefone?: string
  cpf?: string
}

export class FinalizarCheckoutAnonimo {
  async execute(input: FinalizarCheckoutInput): Promise<{ usuarioId: number }> {
    const emailNorm = input.email.trim().toLowerCase()
    const cpfNorm = input.cpf ? normalizeCPF(input.cpf) || null : null

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    })

    if (existente) {
      // Bloqueia guest checkout para contas existentes.
      // Criar sessão para uma conta existente sem autenticação real é uma brecha de segurança —
      // qualquer pessoa com o e-mail poderia obter acesso à conta da vítima.
      // Usuários com conta devem autenticar via OTP antes de chegar aqui.
      throw new ConflictError(
        'Este e-mail já possui uma conta. Faça login com seu código de acesso para continuar.'
      )
    }

    const senha = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)

    let cpfParaSalvar: string | null = null
    if (cpfNorm) {
      const cpfEmUso = await prisma.usuario.findUnique({ where: { cpf: cpfNorm }, select: { id: true } })
      if (!cpfEmUso) cpfParaSalvar = cpfNorm
    }

    const novo = await prisma.usuario.create({
      data: {
        email: emailNorm,
        nome: input.nome.trim(),
        senha,
        telefone: input.telefone || null,
        cpf: cpfParaSalvar,
      },
      select: { id: true },
    })

    // Token de definição de senha — uso único, expira em 72h
    const rawToken = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: {
        token: rawToken,
        usuarioId: novo.id,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    })

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    sendEmail({
      to: emailNorm,
      subject: 'Bem-vindo à 1337 — sua conta foi criada',
      html: emailContaCriadaCheckout({
        nomeCliente: input.nome.trim().split(' ')[0],
        definirSenhaUrl: `${baseUrl}/definir-senha?token=${rawToken}`,
      }),
    }).catch(err => console.error('[Email] Falha ao enviar boas-vindas:', err))

    return { usuarioId: novo.id }
  }
}

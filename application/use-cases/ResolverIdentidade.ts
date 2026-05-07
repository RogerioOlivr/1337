import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { ConflictError } from '@/src/domain/errors/ConflictError'

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function isCPFInput(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  // 11 dígitos e não contém @ (para não confundir com email)
  return digits.length === 11 && !input.includes('@')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}*@${domain}`
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`
}

function nomeFromEmail(email: string): string {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * login       — conta existente encontrada (por email ou CPF)
 * onboarding  — email não existe, conta criada agora (fluxo invisível)
 * sem_conta   — CPF informado mas não encontrado (pedir email)
 */
export type IdentidadeTipo = 'login' | 'onboarding' | 'sem_conta'

export interface IdentidadeResolvidaResult {
  tipo: IdentidadeTipo
  usuarioId?: number
  email?: string
  emailMascarado?: string
  // Mensagem contextual para exibir ao usuário
  mensagem?: string
}

// ─── Use case ────────────────────────────────────────────────────────────────

export class ResolverIdentidade {
  async execute(identifier: string): Promise<IdentidadeResolvidaResult> {
    const input = identifier.trim()

    // ── Fluxo por CPF ────────────────────────────────────────────────────────
    if (isCPFInput(input)) {
      const cpfNorm = normalizeCPF(input)
      const usuario = await prisma.usuario.findUnique({
        where: { cpf: cpfNorm },
        select: { id: true, email: true },
      })

      if (!usuario) {
        return {
          tipo: 'sem_conta',
          mensagem: 'Nenhuma conta encontrada com este CPF. Tente com o seu e-mail.',
        }
      }

      return {
        tipo: 'login',
        usuarioId: usuario.id,
        email: usuario.email,
        emailMascarado: maskEmail(usuario.email),
        mensagem: 'Encontramos uma conta vinculada a este CPF.',
      }
    }

    // ── Fluxo por e-mail ─────────────────────────────────────────────────────
    const emailNorm = input.toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      // Não é email nem CPF válido
      return {
        tipo: 'sem_conta',
        mensagem: 'Informe um e-mail válido ou seu CPF (apenas números).',
      }
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      select: { id: true, email: true },
    })

    if (usuario) {
      return {
        tipo: 'login',
        usuarioId: usuario.id,
        email: usuario.email,
        emailMascarado: maskEmail(usuario.email),
      }
    }

    // Onboarding invisível: cria conta com senha aleatória (nunca usada)
    const senha = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
    const novo = await prisma.usuario.create({
      data: { email: emailNorm, nome: nomeFromEmail(emailNorm), senha },
      select: { id: true, email: true },
    })

    return {
      tipo: 'onboarding',
      usuarioId: novo.id,
      email: novo.email,
      emailMascarado: maskEmail(novo.email),
    }
  }
}

import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { normalizeCPF } from './ResolverIdentidade'

interface EnderecoInput {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

export interface FinalizarCheckoutInput {
  email: string
  nome: string
  telefone?: string
  cpf?: string
  endereco: EnderecoInput
}

export class FinalizarCheckoutAnonimo {
  async execute(input: FinalizarCheckoutInput): Promise<{ usuarioId: number; enderecoId: number }> {
    const emailNorm = input.email.trim().toLowerCase()
    const cpfNorm = input.cpf ? normalizeCPF(input.cpf) || null : null

    let usuarioId: number

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    })

    if (existente) {
      // Conta existente: apenas associa o pedido — nenhum dado do perfil é alterado
      usuarioId = existente.id
    } else {
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

      usuarioId = novo.id
    }

    const endereco = await prisma.endereco.create({
      data: {
        usuarioId,
        cep: input.endereco.cep.replace(/\D/g, ''),
        logradouro: input.endereco.logradouro,
        numero: input.endereco.numero,
        complemento: input.endereco.complemento || null,
        bairro: input.endereco.bairro,
        cidade: input.endereco.cidade,
        estado: input.endereco.estado,
        padrao: false,
      },
      select: { id: true },
    })

    return { usuarioId, enderecoId: endereco.id }
  }
}

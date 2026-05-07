import { prisma } from '@/infra/database/prisma'
import { ResolverIdentidade } from './ResolverIdentidade'
import { ValidationError } from '@/src/domain/errors/ValidationError'

export type CheckoutTipo = 'existente' | 'novo'

export interface IniciarCheckoutResult {
  tipo: CheckoutTipo
  usuarioId: number
  usuario: {
    nome: string
    email: string
    cpf: string | null
    telefone: string | null
  }
  enderecos: Array<{
    id: number
    cep: string
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
    padrao: boolean
  }>
}

const resolver = new ResolverIdentidade()

export class IniciarCheckout {
  async execute(email: string): Promise<IniciarCheckoutResult> {
    const identidade = await resolver.execute(email.trim().toLowerCase())

    if (identidade.tipo === 'sem_conta') {
      throw new ValidationError('Informe um e-mail válido.')
    }

    const usuarioId = identidade.usuarioId!

    const [usuario, enderecos] = await Promise.all([
      prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: { nome: true, email: true, cpf: true, telefone: true },
      }),
      prisma.endereco.findMany({
        where: { usuarioId },
        orderBy: [{ padrao: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    return {
      tipo: identidade.tipo === 'login' ? 'existente' : 'novo',
      usuarioId,
      usuario,
      enderecos,
    }
  }
}

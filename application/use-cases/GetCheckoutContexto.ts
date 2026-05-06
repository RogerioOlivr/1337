import { prisma } from '@/infra/database/prisma'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

export interface EnderecoOutput {
  id: number
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  padrao: boolean
}

export interface CheckoutContextoOutput {
  usuario: {
    nome: string
    email: string
    cpf: string | null
    telefone: string | null
  }
  enderecos: EnderecoOutput[]
}

export class GetCheckoutContexto {
  async execute(usuarioId: number): Promise<CheckoutContextoOutput> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId, ativo: true },
      select: {
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        enderecos: {
          orderBy: [{ padrao: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            cep: true,
            logradouro: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            estado: true,
            padrao: true,
          },
        },
      },
    })

    if (!usuario) throw new NotFoundError('Usuário não encontrado')

    return {
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        telefone: usuario.telefone,
      },
      enderecos: usuario.enderecos,
    }
  }
}

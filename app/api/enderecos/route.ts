import { SalvarEndereco } from '@/application/use-cases/SalvarEndereco'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const salvarEndereco = new SalvarEndereco()

// POST /api/enderecos
// Cria um novo endereço para o usuário logado
export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()

    const { cep, logradouro, numero, complemento, bairro, cidade, estado, padrao } = body

    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      throw new ValidationError('Preencha todos os campos obrigatórios do endereço')
    }

    const endereco = await salvarEndereco.execute({
      usuarioId: session.userId,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      padrao: padrao ?? false,
    })

    return ok(endereco, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

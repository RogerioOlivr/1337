import { FinalizarCheckoutAnonimo } from '@/application/use-cases/FinalizarCheckoutAnonimo'
import { createSession } from '@/src/shared/auth/session'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const finalizar = new FinalizarCheckoutAnonimo()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, nome, telefone, cpf, endereco } = body

    if (!email || !nome || !endereco?.logradouro) {
      throw new ValidationError('Dados incompletos para finalizar o checkout.')
    }

    const result = await finalizar.execute({ email, nome, telefone, cpf, endereco })
    await createSession(result.usuarioId)

    return ok({ usuarioId: result.usuarioId, enderecoId: result.enderecoId })
  } catch (error) {
    return handleApiError(error)
  }
}

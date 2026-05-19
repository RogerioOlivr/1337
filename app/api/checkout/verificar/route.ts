import { VerificarEmailCheckout } from '@/application/use-cases/VerificarEmailCheckout'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const verificar = new VerificarEmailCheckout()

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') throw new ValidationError('E-mail obrigatório.')
    const result = await verificar.execute(email)
    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

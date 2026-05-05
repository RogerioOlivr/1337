import { ValidateMagicLink } from '@/application/use-cases/ValidateMagicLink'
import { createSession } from '@/src/shared/auth/session'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const validateMagicLink = new ValidateMagicLink()

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    const usuario = await validateMagicLink.execute(token)
    await createSession(usuario.id as number)
    return ok({ nome: usuario.nome, email: usuario.email })
  } catch (error) {
    return handleApiError(error)
  }
}

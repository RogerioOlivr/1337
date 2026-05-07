import { IniciarCheckout } from '@/application/use-cases/IniciarCheckout'
import { createSession } from '@/src/shared/auth/session'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const iniciarCheckout = new IniciarCheckout()

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const result = await iniciarCheckout.execute(email)
    await createSession(result.usuarioId)
    return ok({ tipo: result.tipo, usuario: result.usuario, enderecos: result.enderecos })
  } catch (error) {
    return handleApiError(error)
  }
}

import { GetCheckoutContexto } from '@/application/use-cases/GetCheckoutContexto'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const getContexto = new GetCheckoutContexto()

// GET /api/checkout/contexto
// Retorna dados do usuário e endereços salvos para pré-preencher o checkout
export async function GET() {
  try {
    const session = await requireSession()
    const contexto = await getContexto.execute(session.userId)
    return ok(contexto)
  } catch (error) {
    return handleApiError(error)
  }
}

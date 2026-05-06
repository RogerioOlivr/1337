import { ProcessarPagamento } from '@/application/use-cases/ProcessarPagamento'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const processarPagamento = new ProcessarPagamento()

// POST /api/pagamentos
// Body: { pedidoId: number, formData: object }
// formData vem diretamente do Payment Brick do Mercado Pago
export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const { pedidoId, formData } = body

    if (!pedidoId || !Number.isInteger(pedidoId) || pedidoId <= 0) {
      throw new ValidationError('pedidoId deve ser um inteiro positivo')
    }

    if (!formData || typeof formData !== 'object') {
      throw new ValidationError('formData inválido')
    }

    const resultado = await processarPagamento.execute(pedidoId, session.userId, formData)
    return ok(resultado)
  } catch (error) {
    return handleApiError(error)
  }
}

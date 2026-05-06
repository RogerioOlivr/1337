import { UpdatePedidoStatus } from '@/application/use-cases/UpdatePedidoStatus'
import { requireSession } from '@/src/shared/auth/requireSession'
import { prisma } from '@/infra/database/prisma'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const updateStatus = new UpdatePedidoStatus()

// PATCH /api/admin/pedidos/[id]
// Atualiza o status de um pedido (apenas admin)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { role: true },
    })
    if (usuario?.role !== 'admin') {
      throw new ValidationError('Acesso negado')
    }

    const { id } = await params
    const pedidoId = parseInt(id, 10)
    if (isNaN(pedidoId)) throw new ValidationError('ID inválido')

    const body = await request.json()
    const { status } = body
    if (!status) throw new ValidationError('Campo status é obrigatório')

    const result = await updateStatus.execute(pedidoId, status)
    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

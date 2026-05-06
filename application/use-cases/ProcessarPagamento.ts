import { Payment } from 'mercadopago'
import { mp } from '@/src/shared/mercadopago/client'
import { prisma } from '@/infra/database/prisma'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError'
import { ConflictError } from '@/src/domain/errors/ConflictError'

export interface ProcessarPagamentoOutput {
  id: number | string | null
  status: string | null
  status_detail: string | null
}

export class ProcessarPagamento {
  async execute(
    pedidoId: number,
    usuarioId: number,
    formData: Record<string, unknown>
  ): Promise<ProcessarPagamentoOutput> {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } })

    if (!pedido) throw new NotFoundError('Pedido não encontrado')
    if (pedido.usuarioId !== usuarioId) throw new UnauthorizedError()
    if (pedido.status !== 'pendente') {
      throw new ConflictError(`Pedido já possui status "${pedido.status}"`)
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const paymentApi = new Payment(mp)
    const result = await paymentApi.create({
      body: {
        ...formData,
        // Garante que o valor cobrado é sempre o do pedido (não o do frontend)
        transaction_amount: pedido.total,
        external_reference: String(pedidoId),
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    })

    return {
      id: result.id ?? null,
      status: result.status ?? null,
      status_detail: result.status_detail ?? null,
    }
  }
}

import { AtualizarEndereco } from '@/application/use-cases/AtualizarEndereco'
import { DeletarEndereco } from '@/application/use-cases/DeletarEndereco'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const atualizar = new AtualizarEndereco()
const deletar = new DeletarEndereco()

async function getIdParam(params: Promise<{ id: string }>): Promise<number> {
  const { id } = await params
  const n = parseInt(id, 10)
  if (isNaN(n)) throw new ValidationError('ID inválido')
  return n
}

// PATCH /api/enderecos/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const enderecoId = await getIdParam(params)
    const body = await request.json()

    const endereco = await atualizar.execute({ usuarioId: session.userId, enderecoId, ...body })
    return ok(endereco)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/enderecos/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    const enderecoId = await getIdParam(params)

    await deletar.execute(session.userId, enderecoId)
    return ok({})
  } catch (error) {
    return handleApiError(error)
  }
}

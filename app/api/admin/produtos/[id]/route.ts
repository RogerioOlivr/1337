import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError'
import { NotFoundError } from '@/src/domain/errors/NotFoundError'

async function requireAdmin() {
  const session = await requireSession()
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') throw new UnauthorizedError()
}

// PATCH /api/admin/produtos/[id] — edita produto
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await ctx.params
    const body = await request.json()
    const { nome, descricao, preco, imagem, estoque, ativo } = body

    const existe = await prisma.produto.findUnique({ where: { id: Number(id) } })
    if (!existe) throw new NotFoundError('Produto não encontrado')

    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: {
        ...(nome != null && { nome: String(nome) }),
        ...(descricao !== undefined && { descricao: descricao ? String(descricao) : null }),
        ...(preco != null && { preco: parseFloat(preco) }),
        ...(imagem !== undefined && { imagem: imagem ? String(imagem) : null }),
        ...(estoque != null && { estoque: parseInt(estoque) }),
        ...(ativo != null && { ativo: Boolean(ativo) }),
      },
    })

    return ok(produto)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/admin/produtos/[id] — desativa produto (soft delete)
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await ctx.params

    const existe = await prisma.produto.findUnique({ where: { id: Number(id) } })
    if (!existe) throw new NotFoundError('Produto não encontrado')

    await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false },
    })

    return ok({ message: 'Produto desativado' })
  } catch (error) {
    return handleApiError(error)
  }
}

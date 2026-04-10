import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

async function requireAdmin() {
  const session = await requireSession()
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') throw new UnauthorizedError()
}

// GET /api/admin/produtos — lista todos (incluindo inativos)
export async function GET() {
  try {
    await requireAdmin()
    const produtos = await prisma.produto.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return ok(produtos)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/produtos — cria produto
export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { nome, descricao, preco, imagem, estoque } = body

    if (!nome || preco == null || estoque == null) {
      throw new ValidationError('nome, preco e estoque são obrigatórios')
    }

    const produto = await prisma.produto.create({
      data: {
        nome: String(nome),
        descricao: descricao ? String(descricao) : null,
        preco: parseFloat(preco),
        imagem: imagem ? String(imagem) : null,
        estoque: parseInt(estoque),
      },
    })

    return ok(produto, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

import { AtualizarPerfil } from '@/application/use-cases/AtualizarPerfil'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const atualizarPerfil = new AtualizarPerfil()

// PATCH /api/perfil
// Atualiza nome, CPF e/ou telefone do usuário logado
export async function PATCH(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const { nome, cpf, telefone } = body

    const usuario = await atualizarPerfil.execute({
      usuarioId: session.userId,
      nome,
      cpf,
      telefone,
    })

    return ok(usuario)
  } catch (error) {
    return handleApiError(error)
  }
}

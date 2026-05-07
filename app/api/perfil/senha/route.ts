import bcrypt from 'bcrypt'
import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError'

// PATCH /api/perfil/senha
export async function PATCH(request: Request) {
  try {
    const session = await requireSession()
    const { senhaAtual, novaSenha } = await request.json()

    if (!senhaAtual || !novaSenha) throw new ValidationError('Preencha todos os campos.')
    if (novaSenha.length < 8) throw new ValidationError('A nova senha deve ter pelo menos 8 caracteres.')

    const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
    if (!usuario) throw new UnauthorizedError()

    const correta = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!correta) throw new ValidationError('Senha atual incorreta.')

    const hash = await bcrypt.hash(novaSenha, 10)
    await prisma.usuario.update({ where: { id: session.userId }, data: { senha: hash } })

    return ok({})
  } catch (error) {
    return handleApiError(error)
  }
}

import { uploadToCloudinary } from '@/src/shared/cloudinary/upload'
import { requireSession } from '@/src/shared/auth/requireSession'
import { prisma } from '@/infra/database/prisma'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError'

export async function POST(request: Request) {
  try {
    const session = await requireSession()

    // Verifica se o usuário é admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { role: true },
    })
    if (usuario?.role !== 'admin') throw new UnauthorizedError()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return ok({ error: 'Nenhum arquivo enviado' }, 400)
    }

    const url = await uploadToCloudinary(file)
    return ok({ url })
  } catch (error) {
    return handleApiError(error)
  }
}

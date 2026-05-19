import { requireSession } from '@/src/shared/auth/requireSession'
import { prisma } from '@/infra/database/prisma'
import { RequestOtpCode } from '@/application/use-cases/RequestOtpCode'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const requestOtp = new RequestOtpCode()

// POST /api/auth/otp/enviar
// Envia OTP para o e-mail do usuário autenticado (usado pós-compra).
export async function POST() {
  try {
    const session = await requireSession()

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: session.userId },
      select: { email: true },
    })

    const result = await requestOtp.execute(usuario.email)

    return ok({ email: result.email, emailMascarado: result.emailMascarado })
  } catch (error) {
    return handleApiError(error)
  }
}

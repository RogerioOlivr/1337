import { VerifyOtpCode } from '@/application/use-cases/VerifyOtpCode'
import { createSession } from '@/src/shared/auth/session'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const verifyOtp = new VerifyOtpCode()

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()
    if (!email || !code) throw new ValidationError('E-mail e código são obrigatórios.')

    const usuario = await verifyOtp.execute(email, code)
    await createSession(usuario.id)
    return ok({ nome: usuario.nome, email: usuario.email, role: usuario.role })
  } catch (error) {
    return handleApiError(error)
  }
}

import { RequestOtpCode } from '@/application/use-cases/RequestOtpCode'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'
import { ValidationError } from '@/src/domain/errors/ValidationError'

const requestOtp = new RequestOtpCode()

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json()
    if (!identifier?.trim()) throw new ValidationError('Informe seu e-mail ou CPF.')

    const result = await requestOtp.execute(identifier.trim())
    return ok(result)
  } catch (error) {
    return handleApiError(error)
  }
}

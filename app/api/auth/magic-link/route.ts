import { RequestMagicLink } from '@/application/use-cases/RequestMagicLink'
import { ok } from '@/src/shared/api/ApiResponse'
import { handleApiError } from '@/src/shared/api/handleApiError'

const requestMagicLink = new RequestMagicLink()

export async function POST(request: Request) {
  try {
    const { email, redirect } = await request.json()
    const result = await requestMagicLink.execute(email, redirect)
    return ok(result) // em dev: { magicLink: '...' }; em prod: {}
  } catch (error) {
    return handleApiError(error)
  }
}

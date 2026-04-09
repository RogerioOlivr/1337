import { LoginUser } from '@/application/use-cases/LoginUser';
import { createSession } from '@/src/shared/auth/session';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';

const loginUser = new LoginUser();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser.execute(body);
    await createSession(user.id);
    return ok({ nome: user.nome, email: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}

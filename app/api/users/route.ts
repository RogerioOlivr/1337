import { RegisterUser } from '@/application/use-cases/RegisterUser';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';

const registerUser = new RegisterUser();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser.execute(body);
    return ok(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

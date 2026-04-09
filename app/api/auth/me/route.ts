import { getSession } from '@/src/shared/auth/session';
import { prisma } from '@/infra/database/prisma';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError';

// Exemplo de como usar getSession() em qualquer Route Handler protegido.
// Padrão: verificar sessão → buscar dados frescos do banco → retornar.
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError();
    }

    const user = await prisma.usuario.findUnique({
      where: { id: session.userId, ativo: true },
      select: { id: true, nome: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

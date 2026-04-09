import { getSession } from './session';
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError';
import type { JwtPayload } from './jwt';

// Extrai a sessão ou lança UnauthorizedError.
// Use nas rotas protegidas em vez de repetir o if (!session) em cada handler.
export async function requireSession(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

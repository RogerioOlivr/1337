// Este módulo usa next/headers e deve rodar apenas no servidor (Route Handlers, Server Components).
// NÃO importar no middleware.ts — use jwt.ts diretamente lá.
import { cookies } from 'next/headers';
import { signToken, verifyToken, type JwtPayload } from './jwt';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: number): Promise<void> {
  const token = await signToken({ userId });
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + SEVEN_DAYS_MS),
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

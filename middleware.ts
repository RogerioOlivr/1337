import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/shared/auth/jwt';

// Rotas que requerem sessão ativa.
// O middleware roda no Edge Runtime — sem Prisma, sem Node.js APIs, apenas jwt.ts.
const PROTECTED_PATHS = ['/checkout', '/pedidos', '/perfil'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token expirado ou adulterado — apagar o cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/pedidos/:path*', '/perfil/:path*'],
};

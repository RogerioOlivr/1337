import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/shared/auth/jwt';

// Rotas que exigem sessão ativa
const PROTECTED_PATHS = ['/checkout', '/pedidos', '/perfil'];

// Rotas de autenticação — redireciona para longe se já estiver logado
const AUTH_PATHS = ['/login', '/cadastro'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('session')?.value;
  const payload = token ? await verifyToken(token) : null;

  // Usuário logado tentando acessar login/cadastro → vai para home
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Rota protegida
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    if (!token) {
      return NextResponse.redirect(loginUrl);
    }

    if (!payload) {
      // Token expirado ou adulterado
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/cadastro',
    '/checkout/:path*',
    '/pedidos/:path*',
    '/perfil/:path*',
  ],
};

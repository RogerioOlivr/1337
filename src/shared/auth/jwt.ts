import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Estende JWTPayload do jose para herdar o index signature obrigatório
// e os campos padrão (iat, exp, etc.), mantendo nosso campo customizado.
export interface JwtPayload extends JWTPayload {
  userId: number;
}

// Separado de session.ts para ser compatível com o Edge Runtime (usado no middleware).
// Nunca importar `next/headers` ou APIs Node.js aqui.
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado no .env');
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

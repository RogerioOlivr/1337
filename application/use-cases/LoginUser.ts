import { prisma } from '@/infra/database/prisma';
import bcrypt from 'bcrypt';
import { loginUserSchema } from '../validators/loginUserSchema';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { UnauthorizedError } from '@/src/domain/errors/UnauthorizedError';

export interface LoginUserOutput {
  id: number;
  nome: string;
  email: string;
}

export class LoginUser {
  async execute(data: unknown): Promise<LoginUserOutput> {
    const parsed = loginUserSchema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0].message,
        parsed.error.issues
      );
    }

    const { email, senha } = parsed.data;

    const user = await prisma.usuario.findUnique({ where: { email } });

    // Mesma mensagem para "não encontrado" e "senha errada" para não revelar
    // se um e-mail está cadastrado ou não (enumeração de usuários).
    if (!user || !user.ativo) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    return { id: user.id, nome: user.nome, email: user.email };
  }
}

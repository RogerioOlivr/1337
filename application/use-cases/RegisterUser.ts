import { prisma } from '@/infra/database/prisma';
import bcrypt from 'bcrypt';
import { registerUserSchema } from '../validators/registerUserSchema';
import { ConflictError } from '@/src/domain/errors/ConflictError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

export interface RegisterUserOutput {
  id: number;
  nome: string;
  email: string;
}

export class RegisterUser {
  async execute(data: unknown): Promise<RegisterUserOutput> {
    const parsed = registerUserSchema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0].message,
        parsed.error.issues
      );
    }

    const { nome, email, senha } = parsed.data;

    const userExists = await prisma.usuario.findUnique({ where: { email } });

    if (userExists) {
      throw new ConflictError('E-mail já cadastrado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash },
    });

    return { id: user.id, nome: user.nome, email: user.email };
  }
}

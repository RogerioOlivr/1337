import { GetPedido } from '@/application/use-cases/GetPedido';
import { requireSession } from '@/src/shared/auth/requireSession';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

const getPedido = new GetPedido();

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const idNum = Number(id);

    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw new ValidationError('ID deve ser um número inteiro positivo');
    }

    const pedido = await getPedido.execute(idNum, session.userId);
    return ok(pedido);
  } catch (error) {
    return handleApiError(error);
  }
}

import { GetProduto } from '@/application/use-cases/GetProduto';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

const getProduto = new GetProduto();

// Em Next.js 16, params é uma Promise — sempre use await
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const idNum = Number(id);

    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw new ValidationError('ID deve ser um número inteiro positivo');
    }

    const produto = await getProduto.execute(idNum);
    return ok(produto);
  } catch (error) {
    return handleApiError(error);
  }
}

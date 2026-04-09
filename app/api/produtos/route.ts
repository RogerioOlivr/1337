import { ListProdutos } from '@/application/use-cases/ListProdutos';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';

const listProdutos = new ListProdutos();

export async function GET() {
  try {
    const produtos = await listProdutos.execute();
    return ok(produtos);
  } catch (error) {
    return handleApiError(error);
  }
}

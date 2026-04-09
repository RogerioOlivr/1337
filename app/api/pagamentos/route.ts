import { CriarPreferenciaPagamento } from '@/application/use-cases/CriarPreferenciaPagamento';
import { requireSession } from '@/src/shared/auth/requireSession';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';
import { ValidationError } from '@/src/domain/errors/ValidationError';

const criarPreferencia = new CriarPreferenciaPagamento();

// POST /api/pagamentos
// Body: { pedidoId: number }
// Retorna a URL de checkout do Mercado Pago para redirecionar o usuário.
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { pedidoId } = body;

    if (!pedidoId || !Number.isInteger(pedidoId) || pedidoId <= 0) {
      throw new ValidationError('pedidoId deve ser um inteiro positivo');
    }

    const preferencia = await criarPreferencia.execute(pedidoId, session.userId);
    return ok(preferencia, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

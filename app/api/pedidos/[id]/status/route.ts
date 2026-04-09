import { GetPedido } from '@/application/use-cases/GetPedido';
import { UpdatePedidoStatus } from '@/application/use-cases/UpdatePedidoStatus';
import { requireSession } from '@/src/shared/auth/requireSession';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { ConflictError } from '@/src/domain/errors/ConflictError';

const getPedido = new GetPedido();
const updateStatus = new UpdatePedidoStatus();

type Context = { params: Promise<{ id: string }> };

// Usuários autenticados só podem cancelar os próprios pedidos.
// Transições administrativas (pago → enviado, enviado → entregue)
// serão liberadas quando implementarmos roles.
export async function PATCH(request: Request, ctx: Context) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const idNum = Number(id);

    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw new ValidationError('ID deve ser um número inteiro positivo');
    }

    const body = await request.json();
    const { status } = body;

    if (!status) throw new ValidationError('Campo "status" obrigatório');

    // Garante que o pedido pertence ao usuário antes de qualquer mudança
    await getPedido.execute(idNum, session.userId);

    // O usuário autenticado só pode cancelar — demais transições são internas
    if (status !== 'cancelado') {
      throw new ConflictError('Você só pode cancelar um pedido');
    }

    const atualizado = await updateStatus.execute(idNum, status);
    return ok(atualizado);
  } catch (error) {
    return handleApiError(error);
  }
}

import { CreatePedido } from '@/application/use-cases/CreatePedido';
import { ListPedidos } from '@/application/use-cases/ListPedidos';
import { requireSession } from '@/src/shared/auth/requireSession';
import { ok } from '@/src/shared/api/ApiResponse';
import { handleApiError } from '@/src/shared/api/handleApiError';

const createPedido = new CreatePedido();
const listPedidos = new ListPedidos();

export async function GET() {
  try {
    const session = await requireSession();
    const pedidos = await listPedidos.execute(session.userId);
    return ok(pedidos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const pedido = await createPedido.execute({ usuarioId: session.userId, ...body });
    return ok(pedido, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

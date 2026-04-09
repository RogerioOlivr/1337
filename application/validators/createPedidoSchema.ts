import { z } from 'zod';

const itemSchema = z.object({
  produtoId: z.number().int().positive('produtoId deve ser um inteiro positivo'),
  quantidade: z.number().int().positive('quantidade deve ser um inteiro positivo'),
});

export const createPedidoSchema = z.object({
  itens: z
    .array(itemSchema)
    .min(1, 'O pedido deve ter pelo menos um item'),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema> & {
  usuarioId: number;
};

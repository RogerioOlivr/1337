import { z } from 'zod';

const itemSchema = z.object({
  varianteId: z.number().int().positive('varianteId deve ser um inteiro positivo'),
  quantidade: z.number().int().positive('quantidade deve ser um inteiro positivo'),
});

const enderecoFormSchema = z.object({
  cep: z.string().min(8).max(9),
  logradouro: z.string().min(1),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().length(2),
});

export const createPedidoSchema = z.object({
  itens: z.array(itemSchema).min(1, 'O pedido deve ter pelo menos um item'),
  enderecoId: z.number().int().positive().optional(),
  enderecoForm: enderecoFormSchema.optional(),
  freteServico: z.string().optional(),
  freteValor: z.number().nonnegative().optional(),
  fretePrazo: z.number().int().nonnegative().optional(),
  cupomCodigo: z.string().optional(),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema> & {
  usuarioId: number;
};

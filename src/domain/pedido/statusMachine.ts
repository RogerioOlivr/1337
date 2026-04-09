export const PEDIDO_STATUSES = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'] as const;
export type PedidoStatus = (typeof PEDIDO_STATUSES)[number];

// Define quais transições são permitidas a partir de cada status.
// Qualquer transição fora desta tabela é uma violação de regra de negócio.
const TRANSITIONS: Record<PedidoStatus, PedidoStatus[]> = {
  pendente:  ['pago', 'cancelado'],
  pago:      ['enviado', 'cancelado'],
  enviado:   ['entregue'],
  entregue:  [],
  cancelado: [],
};

export function isValidStatus(value: string): value is PedidoStatus {
  return PEDIDO_STATUSES.includes(value as PedidoStatus);
}

export function isTransitionAllowed(from: PedidoStatus, to: PedidoStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

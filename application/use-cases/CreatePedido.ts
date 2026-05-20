import { prisma } from '@/infra/database/prisma';
import { createPedidoSchema, type CreatePedidoInput } from '../validators/createPedidoSchema';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { NotFoundError } from '@/src/domain/errors/NotFoundError';
import { ConflictError } from '@/src/domain/errors/ConflictError';

export interface ItemPedidoOutput {
  id: number;
  produtoId: number;
  varianteId: number | null;
  nomeProduto: string;
  cor: string | null;
  tamanho: string | null;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
}

export interface PedidoOutput {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  itens: ItemPedidoOutput[];
}

export class CreatePedido {
  async execute(input: CreatePedidoInput): Promise<PedidoOutput> {
    const { usuarioId, ...body } = input;

    const parsed = createPedidoSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message, parsed.error.issues);
    }

    const { itens } = parsed.data;
    const varianteIds = itens.map((i) => i.varianteId);

    return prisma.$transaction(async (tx) => {
      const variantes = await tx.varianteProduto.findMany({
        where: { id: { in: varianteIds }, ativo: true },
        include: { produto: { select: { id: true, nome: true, preco: true, ativo: true } } },
      });

      for (const item of itens) {
        const variante = variantes.find((v) => v.id === item.varianteId);
        if (!variante) throw new NotFoundError(`Variante ${item.varianteId} não encontrada`);
        if (!variante.produto.ativo) throw new ConflictError(`Produto "${variante.produto.nome}" não está disponível.`);
        if (variante.estoque < item.quantidade) {
          throw new ConflictError(
            `Estoque insuficiente para "${variante.produto.nome}" (${variante.cor} · ${variante.tamanho}): disponível ${variante.estoque}, solicitado ${item.quantidade}`
          );
        }
      }

      const subtotalProdutos = itens.reduce((acc, item) => {
        const v = variantes.find((v) => v.id === item.varianteId)!;
        return acc + v.produto.preco * item.quantidade;
      }, 0);

      // Cria endereço dentro da transação quando enviado via formulário (Correção 2).
      // Garante que o endereço só persiste se o pedido for criado com sucesso.
      let resolvedEnderecoId: number | null = parsed.data.enderecoId ?? null;
      if (!resolvedEnderecoId && parsed.data.enderecoForm) {
        const ef = parsed.data.enderecoForm;
        const novoEndereco = await tx.endereco.create({
          data: {
            usuarioId,
            cep: ef.cep.replace(/\D/g, ''),
            logradouro: ef.logradouro,
            numero: ef.numero,
            complemento: ef.complemento || null,
            bairro: ef.bairro,
            cidade: ef.cidade,
            estado: ef.estado,
            padrao: false,
          },
          select: { id: true },
        });
        resolvedEnderecoId = novoEndereco.id;
      }

      // Valida freteValor: se há endereço, frete deve ser positivo (impede manipulação de frete grátis via API)
      // Nota: re-validação completa contra Melhor Envio é feita no frontend; aqui aplicamos guarda mínima.
      // TODO-prod: recalcular frete server-side usando CEP do enderecoId + Melhor Envio antes da transação.
      const freteValor = parsed.data.freteValor ?? 0;
      if ((parsed.data.enderecoId || parsed.data.enderecoForm) && freteValor <= 0) {
        throw new ValidationError('Valor de frete inválido para o endereço informado.');
      }

      // Valida e aplica cupom dentro da transação com UPDATE atômico condicional para evitar race condition em maxUsos
      let cupomId: number | null = null;
      let cupomCodigo: string | null = null;
      let desconto = 0;
      if (parsed.data.cupomCodigo) {
        const codigo = parsed.data.cupomCodigo.toUpperCase();
        const cupom = await tx.cupom.findUnique({ where: { codigo } });
        if (!cupom || !cupom.ativo) throw new ConflictError('Cupom inválido ou inativo.');
        if (cupom.expiraEm && cupom.expiraEm < new Date()) throw new ConflictError('Cupom expirado.');
        if (cupom.minPedido != null && subtotalProdutos < cupom.minPedido) throw new ConflictError('Pedido abaixo do valor mínimo do cupom.');

        // UPDATE condicional atômico: só incrementa se ainda dentro do limite.
        // Elimina TOCTOU entre findUnique e update em requisições concorrentes.
        const rowsAffected: number = await tx.$executeRaw`
          UPDATE Cupom SET usos = usos + 1
          WHERE id = ${cupom.id} AND (maxUsos IS NULL OR usos < maxUsos)
        `;
        if (rowsAffected === 0) throw new ConflictError('Cupom esgotado.');

        desconto =
          cupom.tipo === 'percentual'
            ? parseFloat(((subtotalProdutos * cupom.valor) / 100).toFixed(2))
            : parseFloat(Math.min(cupom.valor, subtotalProdutos).toFixed(2));

        cupomId = cupom.id;
        cupomCodigo = cupom.codigo; // snapshot denormalizado para auditoria
      }

      const total = parseFloat((subtotalProdutos + freteValor - desconto).toFixed(2));

      const pedido = await tx.pedido.create({
        data: {
          usuarioId,
          total,
          status: 'pendente',
          enderecoId: resolvedEnderecoId,
          freteServico: parsed.data.freteServico ?? null,
          freteValor: freteValor > 0 ? freteValor : null,
          fretePrazo: parsed.data.fretePrazo ?? null,
          desconto: desconto > 0 ? desconto : null,
          cupomCodigo,
          cupomId,
          itens: {
            create: itens.map((item) => {
              const v = variantes.find((v) => v.id === item.varianteId)!;
              return {
                produtoId: v.produto.id,
                varianteId: v.id,
                cor: v.cor,
                tamanho: v.tamanho,
                quantidade: item.quantidade,
                precoUnit: v.produto.preco,
              };
            }),
          },
        },
        include: {
          itens: { include: { produto: { select: { nome: true } } } },
        },
      });

      // UPDATE condicional atômico: elimina race condition em pedidos simultâneos.
      // Sem isso, dois pedidos com estoque=1 passariam na validação acima e ambos decrementariam.
      for (const item of itens) {
        const rows: number = await tx.$executeRaw`
          UPDATE VarianteProduto SET estoque = estoque - ${item.quantidade}
          WHERE id = ${item.varianteId} AND estoque >= ${item.quantidade}
        `;
        if (rows === 0) {
          const v = variantes.find((v) => v.id === item.varianteId)!;
          throw new ConflictError(
            `Estoque esgotado para "${v.produto.nome}" (${v.cor} · ${v.tamanho}).`
          );
        }
      }

      return {
        id: pedido.id,
        status: pedido.status,
        total: pedido.total,
        createdAt: pedido.createdAt,
        itens: pedido.itens.map((i) => ({
          id: i.id,
          produtoId: i.produtoId,
          varianteId: i.varianteId,
          nomeProduto: i.produto.nome,
          cor: i.cor,
          tamanho: i.tamanho,
          quantidade: i.quantidade,
          precoUnit: i.precoUnit,
          subtotal: i.precoUnit * i.quantidade,
        })),
      };
    });
  }
}

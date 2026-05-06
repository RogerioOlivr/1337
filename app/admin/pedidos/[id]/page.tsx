import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { StatusSelect } from './_components/StatusSelect'
import type { PedidoStatus } from '@/src/domain/pedido/statusMachine'

export default async function AdminPedidoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin/pedidos')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  const { id } = await params
  const pedidoId = parseInt(id, 10)
  if (isNaN(pedidoId)) notFound()

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      usuario: { select: { nome: true, email: true, cpf: true, telefone: true } },
      endereco: true,
      itens: {
        include: {
          produto: { select: { nome: true, imagem: true } },
        },
      },
    },
  })

  if (!pedido) notFound()

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ padding: '48px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/admin/pedidos"
          style={{ fontSize: '12px', color: 'var(--foreground-secondary)', textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          ← PEDIDOS
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '12px' }}>
          <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px' }}>
            PEDIDO #{String(pedido.id).padStart(4, '0')}
          </h1>
          <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
            {fmtDate(pedido.createdAt)}
          </span>
        </div>
      </div>

      {/* Status */}
      <div style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '24px', marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--foreground-secondary)', marginBottom: '12px' }}>
          STATUS
        </p>
        <StatusSelect pedidoId={pedido.id} statusAtual={pedido.status as PedidoStatus} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Cliente */}
        <div style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--foreground-secondary)', marginBottom: '16px' }}>
            CLIENTE
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>{pedido.usuario.nome}</p>
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>{pedido.usuario.email}</p>
            {pedido.usuario.cpf && (
              <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                CPF: {pedido.usuario.cpf}
              </p>
            )}
            {pedido.usuario.telefone && (
              <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                Tel: {pedido.usuario.telefone}
              </p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--foreground-secondary)', marginBottom: '16px' }}>
            ENTREGA
          </p>
          {pedido.endereco ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <p>{pedido.endereco.logradouro}, {pedido.endereco.numero}{pedido.endereco.complemento ? `, ${pedido.endereco.complemento}` : ''}</p>
              <p style={{ color: 'var(--foreground-secondary)' }}>{pedido.endereco.bairro}</p>
              <p style={{ color: 'var(--foreground-secondary)' }}>
                {pedido.endereco.cidade}/{pedido.endereco.estado} · CEP {pedido.endereco.cep}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Endereço não informado</p>
          )}
        </div>
      </div>

      {/* Itens */}
      <div style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--foreground-secondary)' }}>
            ITENS DO PEDIDO
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              {['PRODUTO', 'PREÇO UNIT.', 'QTD', 'SUBTOTAL'].map(h => (
                <th key={h} style={{
                  padding: '12px 24px', textAlign: 'left',
                  fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--foreground-secondary)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.produto.imagem ? (
                      <Image src={item.produto.imagem} alt={item.produto.nome} width={48} height={48} style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: 'var(--surface-light)', flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.produto.nome}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', fontFamily: 'var(--font-geist-mono)' }}>
                  {fmt(item.precoUnit)}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                  {item.quantidade}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>
                  {fmt(item.precoUnit * item.quantidade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '20px 24px',
          borderTop: '1px solid var(--border-light)',
          gap: '24px', alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--foreground-secondary)' }}>
            TOTAL
          </span>
          <span style={{ fontSize: '20px', fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>
            {fmt(pedido.total)}
          </span>
        </div>
      </div>
    </div>
  )
}

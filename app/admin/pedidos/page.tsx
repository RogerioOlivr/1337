import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: '#FEF3C7', color: '#92400E' },
  pago:      { bg: '#DBEAFE', color: '#1E40AF' },
  enviado:   { bg: '#EDE9FE', color: '#5B21B6' },
  entregue:  { bg: '#D1FAE5', color: '#065F46' },
  cancelado: { bg: '#FEE2E2', color: '#991B1B' },
}

export default async function AdminPedidosPage() {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin/pedidos')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      usuario: { select: { nome: true, email: true } },
      itens: { select: { id: true } },
    },
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px' }}>PEDIDOS</h1>
        <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginTop: '4px' }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} no total
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              {['PEDIDO', 'DATA', 'CLIENTE', 'ITENS', 'TOTAL', 'STATUS', 'AÇÕES'].map((h) => (
                <th key={h} style={{
                  padding: '14px 20px', textAlign: 'left',
                  fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--foreground-secondary)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const style = STATUS_STYLE[p.status] ?? STATUS_STYLE.pendente
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font-geist-mono)', fontSize: '13px', fontWeight: 600 }}>
                    #{String(p.id).padStart(4, '0')}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                    {fmtDate(p.createdAt)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500 }}>{p.usuario.nome}</p>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>{p.usuario.email}</p>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                    {p.itens.length}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-geist-mono)', fontWeight: 500 }}>
                    {fmt(p.total)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                      padding: '3px 8px',
                      background: style.bg,
                      color: style.color,
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      style={{ fontSize: '12px', color: 'var(--foreground-primary)', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {pedidos.length === 0 && (
          <p style={{ padding: '48px', textAlign: 'center', color: 'var(--foreground-secondary)', fontSize: '14px' }}>
            Nenhum pedido ainda.
          </p>
        )}
      </div>
    </div>
  )
}

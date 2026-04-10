import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true, nome: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  const [totalProdutos, totalPedidos, totalUsuarios, pedidosPendentes] = await Promise.all([
    prisma.produto.count({ where: { ativo: true } }),
    prisma.pedido.count(),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.pedido.count({ where: { status: 'pendente' } }),
  ])

  const cards = [
    { label: 'Produtos ativos', value: totalProdutos },
    { label: 'Pedidos totais', value: totalPedidos },
    { label: 'Pedidos pendentes', value: pedidosPendentes },
    { label: 'Usuários', value: totalUsuarios },
  ]

  return (
    <div style={{ padding: '48px' }}>
      <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px', marginBottom: '8px' }}>
        OLÁ, {usuario.nome.split(' ')[0].toUpperCase()}
      </h1>
      <p style={{ color: 'var(--foreground-secondary)', marginBottom: '48px', fontSize: '14px' }}>
        Bem-vindo ao painel de administração.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {cards.map(({ label, value }) => (
          <div key={label} style={{
            background: '#fff',
            border: '1px solid var(--border-light)',
            padding: '28px',
          }}>
            <p style={{ fontSize: '36px', fontFamily: 'var(--font-geist-mono)', fontWeight: 700, margin: 0 }}>
              {value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '8px', letterSpacing: '0.05em' }}>
              {label.toUpperCase()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

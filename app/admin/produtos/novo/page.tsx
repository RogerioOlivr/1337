import { requireSession } from '@/src/shared/auth/requireSession'
import { prisma } from '@/infra/database/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProdutoForm from '../_components/ProdutoForm'

export default async function NovoProdutoPage() {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin/produtos/novo')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/produtos" style={{ fontSize: '12px', color: 'var(--foreground-secondary)', textDecoration: 'none' }}>
          ← Produtos
        </Link>
        <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px', marginTop: '8px' }}>NOVO PRODUTO</h1>
      </div>

      <ProdutoForm />
    </div>
  )
}

import { requireSession } from '@/src/shared/auth/requireSession'
import { prisma } from '@/infra/database/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProdutoForm from '../_components/ProdutoForm'

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin/produtos')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  const { id } = await params
  const produto = await prisma.produto.findUnique({ where: { id: Number(id) } })
  if (!produto) notFound()

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/produtos" style={{ fontSize: '12px', color: 'var(--foreground-secondary)', textDecoration: 'none' }}>
          ← Produtos
        </Link>
        <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px', marginTop: '8px' }}>EDITAR PRODUTO</h1>
      </div>

      <ProdutoForm
        inicial={{
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao ?? '',
          preco: String(produto.preco),
          estoque: String(produto.estoque),
          imagem: produto.imagem ?? '',
          ativo: produto.ativo,
        }}
      />
    </div>
  )
}

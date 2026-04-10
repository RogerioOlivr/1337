import { prisma } from '@/infra/database/prisma'
import { requireSession } from '@/src/shared/auth/requireSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminProdutosPage() {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/login?redirect=/admin/produtos')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (usuario?.role !== 'admin') redirect('/')

  const produtos = await prisma.produto.findMany({ orderBy: { createdAt: 'desc' } })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-anton)', fontSize: '36px' }}>PRODUTOS</h1>
        <Link
          href="/admin/produtos/novo"
          style={{
            background: 'var(--foreground-primary)',
            color: 'var(--foreground-inverse)',
            padding: '12px 24px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}
        >
          + NOVO PRODUTO
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              {['IMAGEM', 'NOME', 'PREÇO', 'ESTOQUE', 'STATUS', 'AÇÕES'].map((h) => (
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
            {produtos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 20px' }}>
                  {p.imagem ? (
                    <Image src={p.imagem} alt={p.nome} width={48} height={48} style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, background: 'var(--surface-light)' }} />
                  )}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500 }}>{p.nome}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-geist-mono)' }}>{fmt(p.preco)}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px' }}>{p.estoque}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                    padding: '3px 8px',
                    background: p.ativo ? '#E6F4EA' : '#FEE2E2',
                    color: p.ativo ? '#276749' : '#9B2C2C',
                  }}>
                    {p.ativo ? 'ATIVO' : 'INATIVO'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    style={{ fontSize: '12px', color: 'var(--foreground-primary)', textDecoration: 'underline', fontWeight: 500 }}
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {produtos.length === 0 && (
          <p style={{ padding: '48px', textAlign: 'center', color: 'var(--foreground-secondary)', fontSize: '14px' }}>
            Nenhum produto cadastrado.
          </p>
        )}
      </div>
    </div>
  )
}

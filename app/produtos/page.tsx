import Image from 'next/image'
import Link from 'next/link'
import { ListProdutos } from '@/application/use-cases/ListProdutos'

const listProdutos = new ListProdutos()

export const metadata = {
  title: 'Coleção — 1337',
}

export default async function ProdutosPage() {
  const produtos = await listProdutos.execute()

  const fmt = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <>
      <div className="page-header">
        <h1>COLEÇÃO</h1>
      </div>

      <div className="filter-bar">
        <a href="#" className="active">TODOS</a>
        <a href="#">STREET</a>
        <a href="#">MINIMAL</a>
        <a href="#">TECH</a>
      </div>

      <div style={{ padding: '0 48px 48px' }}>
        {produtos.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--foreground-secondary)' }}>
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <div className="product-grid cols-3" style={{ rowGap: '48px' }}>
            {produtos.map((p) => (
              <Link key={p.id} href={`/produtos/${p.id}`} className="product-card">
                <div className="card-img">
                  {p.imagem ? (
                    <Image src={p.imagem} alt={p.nome} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--background-secondary)' }} />
                  )}
                </div>
                <h3>{p.nome}</h3>
                <p className="price">{fmt(p.preco)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

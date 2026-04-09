import Image from 'next/image'
import Link from 'next/link'
import { ListProdutos } from '@/application/use-cases/ListProdutos'

const listProdutos = new ListProdutos()

export default async function HomePage() {
  const produtos = await listProdutos.execute()
  const destaque = produtos.slice(0, 4)

  const fmt = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <>
      {/* Hero */}
      <section
        className="hero"
        style={{ backgroundImage: "url('/images/generated-1775515847788.png')" }}
      >
        <div className="hero-overlay">
          <span className="subtitle">PREMIUM STREETWEAR ESSENTIALS</span>
          <h1>WEAR<br />THE<br />CODE</h1>
          <Link href="/produtos" className="btn">VER COLEÇÃO</Link>
        </div>
      </section>

      {/* Mais Vendidos */}
      <section className="section">
        <h2 className="section-title">MAIS VENDIDOS</h2>
        <div className="product-grid">
          {destaque.length > 0 ? (
            destaque.map((p) => (
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
            ))
          ) : (
            [
              { img: 'generated-1775515894556.png', nome: 'Camiseta Essential Black', preco: 'R$ 189,00' },
              { img: 'generated-1775515911157.png', nome: 'Camiseta Oversized White', preco: 'R$ 199,00' },
              { img: 'generated-1775515926815.png', nome: 'Camiseta Code Gray', preco: 'R$ 179,00' },
              { img: 'generated-1775515940111.png', nome: 'Camiseta Minimal Logo', preco: 'R$ 169,00' },
            ].map((item) => (
              <Link key={item.img} href="/produtos" className="product-card">
                <div className="card-img">
                  <Image src={`/images/${item.img}`} alt={item.nome} fill style={{ objectFit: 'cover' }} />
                </div>
                <h3>{item.nome}</h3>
                <p className="price">{item.preco}</p>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Coleções */}
      <div className="collections-grid">
        {[
          { img: 'generated-1775515970107.png', label: 'STREET' },
          { img: 'generated-1775515983987.png', label: 'MINIMAL' },
          { img: 'generated-1775515997350.png', label: 'TECH' },
        ].map(({ img, label }) => (
          <div key={label} className="collection-block">
            <Image src={`/images/${img}`} alt={label} fill style={{ objectFit: 'cover' }} />
            <span className="label">{label}</span>
          </div>
        ))}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { useCartStore } from '@/src/store/cartStore'

interface Produto {
  id: number
  nome: string
  descricao: string | null
  preco: number
  imagem: string | null
  estoque: number
}

const SIZES = ['P', 'M', 'G', 'GG']

export default function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const [produto, setProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('G')
  const [added, setAdded] = useState(false)

  const { addItem, openCart } = useCartStore()

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/produtos/${id}`)
        .then((res) => {
          if (!res.ok) notFound()
          return res.json()
        })
        .then((json) => {
          setProduto(json.data)
          setLoading(false)
        })
        .catch(() => notFound())
    })
  }, [params])

  const fmt = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleAddToCart = () => {
    if (!produto) return
    addItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span style={{ color: 'var(--foreground-secondary)', letterSpacing: '0.1em' }}>CARREGANDO...</span>
      </div>
    )
  }

  if (!produto) return null

  return (
    <div className="product-detail">
      {/* Gallery */}
      <div className="gallery">
        <div className="main-img" style={{ position: 'relative', width: '100%', aspectRatio: '3/4' }}>
          {produto.imagem ? (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--background-secondary)' }} />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="product-info">
        <span className="breadcrumb">HOME / COLEÇÃO</span>
        <h1 className="font-heading">{produto.nome.toUpperCase()}</h1>
        <span className="price">{fmt(produto.preco)}</span>
        <div className="divider" />

        {/* Tamanho */}
        <div>
          <p className="option-label">TAMANHO</p>
          <div className="size-options" style={{ marginTop: 12 }}>
            {SIZES.map((s) => (
              <button
                key={s}
                className={`size-btn${selectedSize === s ? ' active' : ''}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          className="btn-primary"
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
        >
          {produto.estoque === 0
            ? 'ESGOTADO'
            : added
            ? 'ADICIONADO!'
            : 'ADICIONAR AO CARRINHO'}
        </button>

        <div className="divider" />

        {/* Descrição */}
        {produto.descricao && (
          <div>
            <p className="option-label">DESCRIÇÃO</p>
            <p className="desc-text" style={{ marginTop: 12 }}>{produto.descricao}</p>
          </div>
        )}

        {/* Detalhes */}
        <div>
          <p className="option-label">DETALHES</p>
          <div className="details-grid" style={{ marginTop: 12 }}>
            <div className="detail-row">
              <span className="label">Material</span>
              <span className="value">100% Algodão Pima</span>
            </div>
            <div className="detail-row">
              <span className="label">Gramatura</span>
              <span className="value">180g/m²</span>
            </div>
            <div className="detail-row">
              <span className="label">Envio</span>
              <span className="value">3-5 dias úteis</span>
            </div>
            <div className="detail-row">
              <span className="label">Devolução</span>
              <span className="value">30 dias grátis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

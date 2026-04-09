'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Truck } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fmt = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // 1. Criar pedido
      const pedidoRes = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: items.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        }),
      })

      const pedidoJson = await pedidoRes.json()
      if (!pedidoRes.ok) {
        setError(pedidoJson.error?.message ?? 'Erro ao criar pedido.')
        setLoading(false)
        return
      }

      const pedidoId: number = pedidoJson.data.id

      // 2. Criar preferência de pagamento no Mercado Pago
      const pagRes = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId }),
      })

      const pagJson = await pagRes.json()
      if (!pagRes.ok) {
        setError(pagJson.error?.message ?? 'Erro ao iniciar pagamento.')
        setLoading(false)
        return
      }

      clearCart()
      window.location.href = pagJson.data.checkoutUrl
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Checkout Navbar */}
      <nav className="checkout-navbar">
        <Link href="/" className="logo font-heading" style={{ textDecoration: 'none', color: 'var(--foreground-primary)' }}>
          1337
        </Link>
        <div className="secure">
          <Lock size={16} />
          <span>COMPRA SEGURA</span>
        </div>
      </nav>
      <div className="divider" />

      <div className="checkout-body">
        {/* Formulário */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          {/* Contato */}
          <div className="form-section">
            <h2 className="font-heading">CONTATO</h2>
            <div className="form-field">
              <label>E-MAIL</label>
              <input type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          {/* Entrega */}
          <div className="form-section">
            <h2 className="font-heading">ENTREGA</h2>
            <div className="form-row">
              <div className="form-field">
                <label>NOME</label>
                <input type="text" placeholder="João" required />
              </div>
              <div className="form-field">
                <label>SOBRENOME</label>
                <input type="text" placeholder="Silva" required />
              </div>
            </div>
            <div className="form-field">
              <label>ENDEREÇO</label>
              <input type="text" placeholder="Rua, número, complemento" required />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>CIDADE</label>
                <input type="text" placeholder="São Paulo" required />
              </div>
              <div className="form-field w-fixed-sm">
                <label>ESTADO</label>
                <input type="text" placeholder="SP" required maxLength={2} />
              </div>
              <div className="form-field w-fixed-md">
                <label>CEP</label>
                <input type="text" placeholder="01000-000" required />
              </div>
            </div>
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '8px' }}>{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading || items.length === 0}>
            {loading
              ? 'PROCESSANDO...'
              : `CONFIRMAR PEDIDO — ${fmt(total())}`}
          </button>

          {items.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginTop: '8px' }}>
              Seu carrinho está vazio.{' '}
              <Link href="/produtos" style={{ textDecoration: 'underline' }}>Ver coleção</Link>
            </p>
          )}
        </form>

        {/* Resumo do pedido */}
        <div className="order-summary">
          <h2 className="font-heading">RESUMO</h2>
          <div className="divider" />

          {items.map((item) => (
            <div key={item.produtoId} className="summary-item">
              {item.imagem ? (
                <Image src={item.imagem} alt={item.nome} width={64} height={64} style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 64, height: 64, background: 'var(--background-secondary)' }} />
              )}
              <div className="summary-item-info">
                <h4>{item.nome}</h4>
                <span className="detail">Qtd: {item.quantidade}</span>
              </div>
              <span className="item-price font-caption">{fmt(item.preco * item.quantidade)}</span>
            </div>
          ))}

          <div className="divider" />

          <div className="summary-totals">
            <div className="row">
              <span className="label">Subtotal</span>
              <span className="value">{fmt(total())}</span>
            </div>
            <div className="row">
              <span className="label">Frete</span>
              <span className="value">Grátis</span>
            </div>
            <div className="divider" />
            <div className="total">
              <span className="label">Total</span>
              <span className="value">{fmt(total())}</span>
            </div>
          </div>

          <div className="delivery-note">
            <Truck size={16} style={{ flexShrink: 0, color: 'var(--foreground-secondary)' }} />
            <span>Entrega estimada: 3-5 dias úteis</span>
          </div>
        </div>
      </div>
    </>
  )
}

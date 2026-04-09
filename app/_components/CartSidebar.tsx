'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCartStore()

  const fmt = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <>
      <div
        className={`cart-overlay${isOpen ? ' open' : ''}`}
        onClick={closeCart}
      />

      <div className={`cart-sidebar${isOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2>CARRINHO</h2>
          <button onClick={closeCart} aria-label="Fechar carrinho">
            <X size={20} />
          </button>
        </div>

        <div className="divider" />

        <div className="cart-items">
          {items.length === 0 ? (
            <p className="cart-empty">Seu carrinho está vazio.</p>
          ) : (
            items.map((item) => (
              <div key={item.produtoId}>
                <div className="cart-item">
                  {item.imagem ? (
                    <Image
                      src={item.imagem}
                      alt={item.nome}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, background: 'var(--background-secondary)' }} />
                  )}
                  <div className="cart-item-info">
                    <h4>{item.nome.toUpperCase()}</h4>
                    <div className="cart-item-bottom">
                      <span className="item-price font-caption">{fmt(item.preco)}</span>
                      <div className="qty-controls">
                        <button onClick={() => updateQty(item.produtoId, -1)}>−</button>
                        <span>{item.quantidade}</span>
                        <button onClick={() => updateQty(item.produtoId, 1)}>+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.produtoId)}
                      style={{ fontSize: '11px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', textDecoration: 'underline' }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="divider" />
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="summary-row">
              <span className="label">Subtotal</span>
              <span className="value">{fmt(total())}</span>
            </div>
            <div className="summary-row">
              <span className="label">Frete</span>
              <span className="value">Grátis</span>
            </div>
            <div className="divider" />
            <div className="total-row">
              <span className="label">Total</span>
              <span className="value">{fmt(total())}</span>
            </div>
            <Link href="/checkout" className="btn-checkout" onClick={closeCart}>
              FINALIZAR COMPRA
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

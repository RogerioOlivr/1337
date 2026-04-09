'use client'

import Link from 'next/link'
import { Search, ShoppingBag, User } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'

export default function Navbar() {
  const { toggleCart, count } = useCartStore()
  const itemCount = count()

  return (
    <nav className="navbar">
      <Link href="/" className="logo">1337</Link>
      <div className="nav-icons">
        <a href="#" aria-label="Buscar">
          <Search size={20} />
        </a>
        <button
          onClick={toggleCart}
          aria-label="Carrinho"
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ShoppingBag size={20} />
          {itemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'var(--foreground-primary)',
              color: 'var(--background-primary)',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              letterSpacing: 0,
            }}>
              {itemCount}
            </span>
          )}
        </button>
        <Link href="/login" aria-label="Conta">
          <User size={20} />
        </Link>
      </div>
    </nav>
  )
}

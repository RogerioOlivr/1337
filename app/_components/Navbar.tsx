'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag, User, LogOut, Package, Settings, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'
import { useSessionStore } from '@/src/store/sessionStore'

export default function Navbar() {
  const router = useRouter()
  const { toggleCart, count } = useCartStore()
  const { user, checked, fetchSession, logout } = useSessionStore()
  const itemCount = count()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Verifica sessão uma vez ao montar
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    router.push('/')
    router.refresh()
  }

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

        {/* Área do usuário */}
        {!checked ? (
          // Placeholder enquanto verifica sessão (evita flash)
          <span style={{ width: 20, height: 20, display: 'block' }} />
        ) : user ? (
          // Logado → dropdown
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Menu da conta"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: 0,
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            >
              <User size={20} />
              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nome.split(' ')[0].toUpperCase()}
              </span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 16px)',
                right: 0,
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-light)',
                minWidth: '200px',
                zIndex: 200,
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{user.nome}</p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground-secondary)', margin: '2px 0 0', letterSpacing: '0.02em' }}>{user.email}</p>
                </div>

                <div style={{ padding: '8px 0' }}>
                  <Link
                    href="/pedidos"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', fontSize: '12px', letterSpacing: '0.08em',
                      color: 'var(--foreground-primary)', textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    className="nav-dropdown-item"
                  >
                    <Package size={15} />
                    MEUS PEDIDOS
                  </Link>

                  <Link
                    href="/minha-conta"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', fontSize: '12px', letterSpacing: '0.08em',
                      color: 'var(--foreground-primary)', textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    className="nav-dropdown-item"
                  >
                    <Settings size={15} />
                    MINHA CONTA
                  </Link>
                </div>

                {user.role === 'admin' && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px 0' }}>
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', fontSize: '12px', letterSpacing: '0.08em',
                        color: 'var(--foreground-primary)', textDecoration: 'none',
                        fontWeight: 700,
                      }}
                      className="nav-dropdown-item"
                    >
                      <LayoutDashboard size={15} />
                      ADMIN
                    </Link>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px 0' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', fontSize: '12px', letterSpacing: '0.08em',
                      color: 'var(--foreground-primary)', background: 'none',
                      border: 'none', cursor: 'pointer', width: '100%',
                      fontWeight: 500, fontFamily: 'inherit',
                    }}
                    className="nav-dropdown-item"
                  >
                    <LogOut size={15} />
                    SAIR
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Não logado → link para login
          <Link href="/login" aria-label="Entrar">
            <User size={20} />
          </Link>
        )}
      </div>
    </nav>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSessionStore } from '@/src/store/sessionStore'
import { User, MapPin, Package, Shield } from 'lucide-react'

const NAV = [
  { href: '/minha-conta/perfil',    label: 'Dados pessoais', icon: User },
  { href: '/minha-conta/enderecos', label: 'Endereços',      icon: MapPin },
  { href: '/minha-conta/pedidos',   label: 'Meus pedidos',   icon: Package },
  { href: '/minha-conta/seguranca', label: 'Segurança',      icon: Shield },
]

export default function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, checked, fetchSession } = useSessionStore()

  useEffect(() => {
    if (!checked) fetchSession()
  }, [checked, fetchSession])

  useEffect(() => {
    if (checked && !user) router.replace('/login?redirect=/minha-conta/perfil')
  }, [checked, user, router])

  if (!checked || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span style={{ color: 'var(--foreground-secondary)', fontSize: '13px', letterSpacing: '0.1em' }}>CARREGANDO...</span>
      </div>
    )
  }

  const inicial = user.nome.charAt(0).toUpperCase()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '48px', alignItems: 'start' }}>

      {/* Sidebar */}
      <aside>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'var(--foreground-primary)',
            color: 'var(--foreground-inverse)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-geist-mono)', fontSize: '18px', fontWeight: 700,
            flexShrink: 0,
          }}>
            {inicial}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.nome.split(' ')[0]}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--foreground-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--foreground-primary)' : 'var(--foreground-secondary)',
                  textDecoration: 'none',
                  background: active ? 'var(--surface-light)' : 'transparent',
                  borderLeft: active ? '2px solid var(--foreground-primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main style={{ minWidth: 0 }}>
        {children}
      </main>

    </div>
  )
}

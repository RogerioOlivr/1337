import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — 1337' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: 'var(--surface-dark)',
        color: 'var(--foreground-inverse)',
        padding: '32px 0',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #333' }}>
          <Link href="/" style={{ color: 'var(--foreground-inverse)', textDecoration: 'none', fontFamily: 'var(--font-anton)', fontSize: '24px' }}>
            1337
          </Link>
          <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#666', marginTop: '4px' }}>ADMIN</p>
        </div>

        <nav style={{ padding: '16px 0' }}>
          {[
            { href: '/admin', label: 'DASHBOARD' },
            { href: '/admin/produtos', label: 'PRODUTOS' },
            { href: '/admin/pedidos', label: 'PEDIDOS' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '12px 24px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#999',
                textDecoration: 'none',
              }}
              className="admin-nav-item"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid #333' }}>
          <Link href="/" style={{ fontSize: '11px', color: '#666', textDecoration: 'none', letterSpacing: '0.1em' }}>
            ← VOLTAR AO SITE
          </Link>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, background: '#F9F9F9', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

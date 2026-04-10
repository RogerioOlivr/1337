'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/src/store/sessionStore'

interface Me {
  id: number
  nome: string
  email: string
  createdAt: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { logout } = useSessionStore()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j) => { setMe(j.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 24px' }}>
      <h1 className="font-heading" style={{ fontSize: '48px', marginBottom: '48px' }}>CONFIGURAÇÕES</h1>

      {loading ? (
        <p style={{ color: 'var(--foreground-secondary)' }}>Carregando...</p>
      ) : me ? (
        <>
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            {[
              { label: 'NOME', value: me.nome },
              { label: 'E-MAIL', value: me.email },
              { label: 'MEMBRO DESDE', value: fmtDate(me.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--foreground-secondary)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '14px' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '48px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '16px',
                background: 'none',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--foreground-secondary)',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--foreground-primary)'
                e.currentTarget.style.color = 'var(--foreground-inverse)'
                e.currentTarget.style.borderColor = 'var(--foreground-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'var(--foreground-secondary)'
                e.currentTarget.style.borderColor = 'var(--border-light)'
              }}
            >
              SAIR DA CONTA
            </button>
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--foreground-secondary)' }}>Não foi possível carregar os dados.</p>
      )}
    </div>
  )
}

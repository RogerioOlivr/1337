'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const senha = (form.elements.namedItem('senha') as HTMLInputElement).value

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message ?? 'Credenciais inválidas.')
      setLoading(false)
      return
    }

    router.push('/checkout')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="font-heading" style={{ fontSize: '48px', marginBottom: '8px' }}>ENTRAR</h1>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
          Não tem conta?{' '}
          <Link href="/cadastro" style={{ color: 'var(--foreground-primary)', textDecoration: 'underline' }}>
            Criar conta
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-field">
            <label>E-MAIL</label>
            <input name="email" type="email" placeholder="seu@email.com" required autoComplete="email" />
          </div>

          <div className="form-field">
            <label>SENHA</label>
            <input name="senha" type="password" placeholder="••••••••" required autoComplete="current-password" />
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}

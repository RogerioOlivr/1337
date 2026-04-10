'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const senha = (form.elements.namedItem('senha') as HTMLInputElement).value

    // 1. Cadastrar
    const regRes = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })

    const regJson = await regRes.json()

    if (!regRes.ok) {
      setError(regJson.error?.message ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // 2. Fazer login automaticamente
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })

    if (!loginRes.ok) {
      // Conta criada mas login falhou — redirecionar para login
      router.push('/login')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="font-heading" style={{ fontSize: '48px', marginBottom: '8px' }}>CRIAR CONTA</h1>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--foreground-primary)', textDecoration: 'underline' }}>
            Entrar
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-field">
            <label>NOME</label>
            <input name="nome" type="text" placeholder="João Silva" required autoComplete="name" />
          </div>

          <div className="form-field">
            <label>E-MAIL</label>
            <input name="email" type="email" placeholder="seu@email.com" required autoComplete="email" />
          </div>

          <div className="form-field">
            <label>SENHA</label>
            <input name="senha" type="password" placeholder="••••••••" required minLength={6} autoComplete="new-password" />
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
          </button>
        </form>
      </div>
    </div>
  )
}

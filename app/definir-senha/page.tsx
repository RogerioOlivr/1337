'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function DefinirSenhaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/definir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message ?? 'Erro ao definir senha.'); return }
      setSucesso(true)
      setTimeout(() => router.push('/'), 3000)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#555' }}>Link inválido ou expirado.</p>
        <Link href="/" style={{ fontSize: '13px', color: '#111', textDecoration: 'underline' }}>Voltar ao início</Link>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: 8 }}>Senha definida!</p>
        <p style={{ fontSize: '14px', color: '#555' }}>Redirecionando...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <Lock size={16} />
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>DEFINIR SENHA</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#999' }}>NOVA SENHA</label>
          <input
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            autoFocus
            style={{ height: 44, padding: '0 12px', fontSize: '14px', border: '1px solid #e0e0e0', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#999' }}>CONFIRMAR SENHA</label>
          <input
            type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            placeholder="Repita a senha"
            minLength={8}
            required
            style={{ height: 44, padding: '0 12px', fontSize: '14px', border: '1px solid #e0e0e0', outline: 'none' }}
          />
        </div>

        {error && <p style={{ fontSize: '12px', color: '#e53e3e', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: 48, background: '#111', color: '#fff', border: 'none',
            fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'SALVANDO...' : 'SALVAR SENHA'}
        </button>
      </form>
    </div>
  )
}

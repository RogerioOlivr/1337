'use client'

import { useState, useEffect } from 'react'
import { useSessionStore } from '@/src/store/sessionStore'
import { Check } from 'lucide-react'

interface Me {
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  createdAt: string
}

export default function PerfilPage() {
  const { fetchSession } = useSessionStore()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(j => {
        const u: Me = j.data
        setMe(u)
        const partes = u.nome.trim().split(/\s+/)
        setNome(partes[0] ?? '')
        setSobrenome(partes.slice(1).join(' '))
        setTelefone(u.telefone ?? '')
        setCpf(u.cpf ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: `${nome} ${sobrenome}`.trim(), cpf, telefone }),
    })

    setSaving(false)

    if (!res.ok) {
      const j = await res.json()
      setError(j.error?.message ?? 'Erro ao salvar.')
      return
    }

    setSaved(true)
    fetchSession()
    setTimeout(() => setSaved(false), 3000)
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (loading) return <p style={{ color: 'var(--foreground-secondary)', fontSize: '13px' }}>Carregando...</p>

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="font-heading" style={{ fontSize: '32px' }}>DADOS PESSOAIS</h1>
        {me && (
          <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '4px' }}>
            Membro desde {fmtDate(me.createdAt)}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-field">
            <label>NOME</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" required />
          </div>
          <div className="form-field">
            <label>SOBRENOME</label>
            <input value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Sobrenome" />
          </div>
        </div>

        <div className="form-field">
          <label>E-MAIL</label>
          <input
            type="email"
            value={me?.email ?? ''}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--foreground-secondary)', marginTop: '4px', display: 'block' }}>
            O e-mail não pode ser alterado por aqui.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-field">
            <label>TELEFONE</label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="form-field">
            <label>CPF</label>
            <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
        </div>

        {error && <p style={{ color: '#e53e3e', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '12px 32px' }}>
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#276749' }}>
              <Check size={14} /> Salvo com sucesso
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

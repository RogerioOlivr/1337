'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, X, Check } from 'lucide-react'

interface Endereco {
  id: number
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  padrao: boolean
}

const VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

export default function EnderecosPage() {
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<number | 'novo' | null>(null)
  const [form, setForm] = useState(VAZIO)
  const [cepLoading, setCepLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    fetch('/api/enderecos').then(r => r.json()).then(j => {
      setEnderecos(j.data ?? [])
      setLoading(false)
    })

  useEffect(() => { load() }, [])

  const handleCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setForm(f => ({ ...f, cep: raw }))
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const j = await r.json()
      if (!j.erro) setForm(f => ({ ...f, logradouro: j.logradouro ?? '', bairro: j.bairro ?? '', cidade: j.localidade ?? '', estado: j.uf ?? '' }))
    } finally { setCepLoading(false) }
  }

  const abrirNovo = () => {
    setForm(VAZIO)
    setEditando('novo')
    setError(null)
  }

  const abrirEdicao = (end: Endereco) => {
    setForm({ cep: end.cep, logradouro: end.logradouro, numero: end.numero, complemento: end.complemento ?? '', bairro: end.bairro, cidade: end.cidade, estado: end.estado })
    setEditando(end.id)
    setError(null)
  }

  const cancelar = () => { setEditando(null); setError(null) }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const isNovo = editando === 'novo'
    const url = isNovo ? '/api/enderecos' : `/api/enderecos/${editando}`
    const method = isNovo ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...(isNovo ? { padrao: enderecos.length === 0 } : {}) }),
    })

    setSaving(false)

    if (!res.ok) {
      const j = await res.json()
      setError(j.error?.message ?? 'Erro ao salvar.')
      return
    }

    setEditando(null)
    load()
  }

  const handleDefinirPadrao = async (id: number) => {
    await fetch(`/api/enderecos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ padrao: true }),
    })
    load()
  }

  const handleDeletar = async (id: number) => {
    if (!confirm('Remover este endereço?')) return
    const res = await fetch(`/api/enderecos/${id}`, { method: 'DELETE' })
    if (!res.ok) { const j = await res.json(); alert(j.error?.message ?? 'Erro ao remover.'); return }
    load()
  }

  const FormEndereco = (
    <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--surface-light)', marginTop: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
        <div className="form-field">
          <label>CEP {cepLoading && <span style={{ fontWeight: 400, letterSpacing: 0 }}>buscando...</span>}</label>
          <input value={form.cep} onChange={e => handleCep(e.target.value)} placeholder="00000-000" maxLength={9} required />
        </div>
        <div className="form-field">
          <label>LOGRADOURO</label>
          <input value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))} placeholder="Rua, Av..." required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
        <div className="form-field">
          <label>NÚMERO</label>
          <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="123" required />
        </div>
        <div className="form-field">
          <label>COMPLEMENTO</label>
          <input value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} placeholder="Apto, Bloco... (opcional)" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '12px' }}>
        <div className="form-field">
          <label>BAIRRO</label>
          <input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label>CIDADE</label>
          <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label>UF</label>
          <input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} maxLength={2} required />
        </div>
      </div>

      {error && <p style={{ color: '#e53e3e', fontSize: '13px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px', fontSize: '11px' }}>
          {saving ? 'SALVANDO...' : 'SALVAR'}
        </button>
        <button type="button" onClick={cancelar} style={{ padding: '10px 20px', fontSize: '11px', background: 'none', border: '1px solid var(--border-light)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', fontWeight: 600 }}>
          CANCELAR
        </button>
      </div>
    </form>
  )

  if (loading) return <p style={{ color: 'var(--foreground-secondary)', fontSize: '13px' }}>Carregando...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 className="font-heading" style={{ fontSize: '32px' }}>ENDEREÇOS</h1>
        {editando !== 'novo' && (
          <button
            onClick={abrirNovo}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'var(--foreground-primary)', color: 'var(--foreground-inverse)', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'inherit' }}
          >
            <Plus size={14} /> NOVO ENDEREÇO
          </button>
        )}
      </div>

      {/* Form novo */}
      {editando === 'novo' && FormEndereco}

      {/* Lista */}
      {enderecos.length === 0 && editando !== 'novo' ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--foreground-secondary)' }}>
          <p style={{ marginBottom: '16px', fontSize: '14px' }}>Nenhum endereço salvo.</p>
          <button onClick={abrirNovo} style={{ fontSize: '12px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-primary)' }}>
            Adicionar meu primeiro endereço
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-light)', marginTop: editando === 'novo' ? '16px' : 0 }}>
          {enderecos.map(end => (
            <div key={end.id} style={{ background: 'var(--surface-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 24px', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>
                      {end.logradouro}, {end.numero}{end.complemento ? `, ${end.complemento}` : ''}
                    </p>
                    {end.padrao && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#276749', background: '#D1FAE5', padding: '2px 6px' }}>
                        <Check size={10} /> PADRÃO
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                    {end.bairro} · {end.cidade}/{end.estado} · CEP {end.cep}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {!end.padrao && (
                    <button
                      onClick={() => handleDefinirPadrao(end.id)}
                      title="Definir como padrão"
                      style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex' }}
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => editando === end.id ? cancelar() : abrirEdicao(end)}
                    title="Editar"
                    style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex' }}
                  >
                    {editando === end.id ? <X size={16} /> : <Pencil size={16} />}
                  </button>
                  <button
                    onClick={() => handleDeletar(end.id)}
                    title="Remover"
                    style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#9B2C2C', display: 'flex' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {editando === end.id && FormEndereco}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

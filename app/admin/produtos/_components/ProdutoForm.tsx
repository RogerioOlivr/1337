'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface FormState {
  id?: number
  nome: string
  descricao: string
  preco: string
  estoque: string
  imagem: string
  ativo: boolean
}

interface ProdutoFormProps {
  inicial?: FormState
}

const DEFAULT: FormState = {
  nome: '', descricao: '', preco: '', estoque: '', imagem: '', ativo: true,
}

export default function ProdutoForm({ inicial }: ProdutoFormProps) {
  const router = useRouter()
  const data = inicial ?? DEFAULT
  const isEdit = !!data.id

  const [form, setForm] = useState<FormState>(data)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message ?? 'Erro no upload.')
    } else {
      set('imagem', json.data.url)
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      preco: parseFloat(form.preco),
      estoque: parseInt(form.estoque),
      imagem: form.imagem || null,
      ativo: form.ativo,
    }

    const url = isEdit ? `/api/admin/produtos/${form.id}` : '/api/admin/produtos'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message ?? 'Erro ao salvar.')
      setSaving(false)
      return
    }

    router.push('/admin/produtos')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!form.id) return
    if (!confirm('Desativar este produto?')) return

    await fetch(`/api/admin/produtos/${form.id}`, { method: 'DELETE' })
    router.push('/admin/produtos')
    router.refresh()
  }

  const fieldStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '6px',
  }
  const labelStyle = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--foreground-secondary)',
  }
  const inputStyle = {
    height: '44px',
    padding: '0 14px',
    border: '1px solid var(--border-light)',
    background: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={fieldStyle}>
        <label style={labelStyle}>NOME *</label>
        <input style={inputStyle} value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>DESCRIÇÃO</label>
        <textarea
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          rows={4}
          style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>PREÇO (R$) *</label>
          <input
            style={inputStyle}
            type="number"
            step="0.01"
            min="0"
            value={form.preco}
            onChange={(e) => set('preco', e.target.value)}
            required
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>ESTOQUE *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            value={form.estoque}
            onChange={(e) => set('estoque', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Upload de imagem */}
      <div style={fieldStyle}>
        <label style={labelStyle}>IMAGEM</label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {form.imagem && (
            <Image
              src={form.imagem}
              alt="Preview"
              width={96}
              height={96}
              style={{ objectFit: 'cover', border: '1px solid var(--border-light)', flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: '#fff',
            }}>
              {uploading ? 'ENVIANDO...' : 'SELECIONAR FOTO'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            {form.imagem && (
              <p style={{ fontSize: '11px', color: 'var(--foreground-secondary)', wordBreak: 'break-all' }}>
                {form.imagem}
              </p>
            )}
          </div>
        </div>
      </div>

      {isEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="ativo"
            checked={form.ativo}
            onChange={(e) => set('ativo', e.target.checked)}
          />
          <label htmlFor="ativo" style={{ fontSize: '13px', cursor: 'pointer' }}>Produto ativo (visível na loja)</label>
        </div>
      )}

      {error && (
        <p style={{ color: '#e53e3e', fontSize: '13px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
        <button
          type="submit"
          disabled={saving || uploading}
          style={{
            flex: 1,
            height: '48px',
            background: 'var(--foreground-primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'SALVANDO...' : isEdit ? 'SALVAR ALTERAÇÕES' : 'CRIAR PRODUTO'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '0 20px',
              height: '48px',
              background: 'none',
              border: '1px solid #FCA5A5',
              color: '#9B2C2C',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'inherit',
            }}
          >
            DESATIVAR
          </button>
        )}
      </div>
    </form>
  )
}

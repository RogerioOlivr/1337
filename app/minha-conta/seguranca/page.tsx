'use client'

import { useState } from 'react'
import { useSessionStore } from '@/src/store/sessionStore'
import { ShieldCheck, LogOut, KeyRound } from 'lucide-react'

export default function SegurancaPage() {
  const { user, logout } = useSessionStore()
  const [showSenha, setShowSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const handleSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaSenha !== confirmar) { setMsg({ type: 'err', text: 'As senhas não coincidem.' }); return }
    if (novaSenha.length < 8) { setMsg({ type: 'err', text: 'A senha deve ter pelo menos 8 caracteres.' }); return }

    setSaving(true)
    setMsg(null)

    const res = await fetch('/api/perfil/senha', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    })

    setSaving(false)

    if (!res.ok) {
      const j = await res.json()
      setMsg({ type: 'err', text: j.error?.message ?? 'Erro ao alterar senha.' })
      return
    }

    setMsg({ type: 'ok', text: 'Senha alterada com sucesso.' })
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmar('')
    setShowSenha(false)
  }

  return (
    <div>
      <h1 className="font-heading" style={{ fontSize: '32px', marginBottom: '32px' }}>SEGURANÇA</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-light)', maxWidth: '560px' }}>

        {/* Método principal */}
        <div style={{ background: 'var(--surface-primary)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShieldCheck size={20} style={{ color: '#276749', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600 }}>Login por código</p>
            <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>
              Código de 6 dígitos enviado para {user?.email}
            </p>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, background: '#D1FAE5', color: '#276749', padding: '3px 8px', letterSpacing: '0.08em' }}>
            ATIVO
          </span>
        </div>

        {/* Alterar senha */}
        <div style={{ background: 'var(--surface-primary)' }}>
          <button
            onClick={() => { setShowSenha(v => !v); setMsg(null) }}
            style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <KeyRound size={20} style={{ color: 'var(--foreground-secondary)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-primary)' }}>Alterar senha</p>
              <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>
                Método alternativo de acesso
              </p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>{showSenha ? 'Cancelar' : 'Alterar'}</span>
          </button>

          {showSenha && (
            <form onSubmit={handleSenha} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-field">
                <label>SENHA ATUAL</label>
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required autoFocus />
              </div>
              <div className="form-field">
                <label>NOVA SENHA</label>
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required minLength={8} />
              </div>
              <div className="form-field">
                <label>CONFIRMAR NOVA SENHA</label>
                <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
              </div>

              {msg && (
                <p style={{ fontSize: '13px', color: msg.type === 'ok' ? '#276749' : '#e53e3e' }}>{msg.text}</p>
              )}

              <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px', fontSize: '11px' }}>
                {saving ? 'SALVANDO...' : 'SALVAR SENHA'}
              </button>
            </form>
          )}
        </div>

        {/* Sair */}
        <div style={{ background: 'var(--surface-primary)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <LogOut size={20} style={{ color: '#9B2C2C', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#9B2C2C' }}>Sair da conta</p>
              <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>Encerrar sessão neste dispositivo</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}

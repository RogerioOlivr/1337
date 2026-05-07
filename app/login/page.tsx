'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/src/store/sessionStore'
import { ArrowLeft } from 'lucide-react'

type Etapa = 'identifier' | 'otp' | 'senha'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchSession } = useSessionStore()

  const [etapa, setEtapa] = useState<Etapa>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [emailDisplay, setEmailDisplay] = useState('')
  const [otpContexto, setOtpContexto] = useState<string | null>(null) // mensagem contextual
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const redirect = searchParams.get('redirect') ?? '/'

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error?.message ?? 'Erro ao enviar código.'); return }

    // CPF informado mas sem conta — mostra mensagem, não avança
    if (json.data.tipo === 'sem_conta') {
      setError(json.data.mensagem ?? 'Nenhuma conta encontrada. Tente com o seu e-mail.')
      return
    }

    setEmail(json.data.email)
    setEmailDisplay(json.data.emailMascarado)
    setOtpContexto(json.data.mensagem ?? null)
    setEtapa('otp')
    setCountdown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  const handleVerifyOtp = useCallback(async (codeArr?: string[]) => {
    const code = (codeArr ?? otp).join('')
    if (code.length < 6) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error?.message ?? 'Código inválido.'); return }

    await fetchSession()
    router.push(redirect)
    router.refresh()
  }, [otp, email, fetchSession, router, redirect])

  const handleOtpChange = (index: number, value: string) => {
    // Suporte a colar o código completo
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d })
      setOtp(newOtp)
      const nextIdx = Math.min(index + digits.length, 5)
      otpRefs.current[nextIdx]?.focus()
      if (newOtp.every(d => d !== '')) handleVerifyOtp(newOtp)
      return
    }

    const digit = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (newOtp.every(d => d !== '')) handleVerifyOtp(newOtp)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier.trim(), senha }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error?.message ?? 'Credenciais inválidas.'); return }

    await fetchSession()
    router.push(redirect)
    router.refresh()
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ── Identifier ── */}
        {etapa === 'identifier' && (
          <>
            <h1 className="font-heading" style={{ fontSize: '48px', marginBottom: '8px' }}>ENTRAR</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: 'var(--foreground-primary)', textDecoration: 'underline' }}>
                Criar conta
              </Link>
            </p>

            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-field">
                <label>E-MAIL OU CPF</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="seu@email.com ou 000.000.000-00"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'ENVIANDO CÓDIGO...' : 'CONTINUAR'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setEtapa('senha')}
                  style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Entrar com senha
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── OTP ── */}
        {etapa === 'otp' && (
          <>
            <button
              onClick={() => { setEtapa('identifier'); setOtp(['','','','','','']); setError(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: '12px', marginBottom: '32px', padding: 0 }}
            >
              <ArrowLeft size={14} /> VOLTAR
            </button>

            <h1 className="font-heading" style={{ fontSize: '40px', marginBottom: '8px' }}>CÓDIGO DE ACESSO</h1>
            {otpContexto && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#EFF6FF', marginBottom: '16px', fontSize: '13px', color: '#1E40AF' }}>
                {otpContexto}
              </div>
            )}
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
              Enviamos um código de 6 dígitos para <strong>{emailDisplay}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  style={{
                    width: '52px', height: '60px',
                    textAlign: 'center',
                    fontSize: '24px', fontWeight: 700,
                    fontFamily: 'var(--font-geist-mono)',
                    border: `2px solid ${digit ? 'var(--foreground-primary)' : 'var(--border-light)'}`,
                    background: 'var(--surface-primary)',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                />
              ))}
            </div>

            {loading && (
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginBottom: '16px' }}>Verificando...</p>
            )}

            {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              {countdown > 0 ? (
                <span>Reenviar em {countdown}s</span>
              ) : (
                <button
                  onClick={handleRequestOtp as unknown as React.MouseEventHandler}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--foreground-primary)', textDecoration: 'underline', padding: 0 }}
                >
                  Reenviar código
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Senha ── */}
        {etapa === 'senha' && (
          <>
            <button
              onClick={() => { setEtapa('identifier'); setError(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: '12px', marginBottom: '32px', padding: 0 }}
            >
              <ArrowLeft size={14} /> VOLTAR
            </button>

            <h1 className="font-heading" style={{ fontSize: '40px', marginBottom: '8px' }}>ENTRAR COM SENHA</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
              Método alternativo — recomendamos usar o código por e-mail.
            </p>

            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-field">
                <label>E-MAIL</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>SENHA</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}

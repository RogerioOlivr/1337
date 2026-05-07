'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/src/store/sessionStore'
import { ArrowLeft } from 'lucide-react'

type Etapa = 'email' | 'otp'

export default function CadastroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchSession } = useSessionStore()

  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState('')
  const [emailReal, setEmailReal] = useState('')
  const [emailDisplay, setEmailDisplay] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const redirect = searchParams.get('redirect') ?? '/'

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
      body: JSON.stringify({ identifier: email.trim() }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error?.message ?? 'Erro ao enviar código.'); return }
    if (json.data.tipo === 'sem_conta') { setError(json.data.mensagem ?? 'Informe um e-mail válido.'); return }

    setEmailReal(json.data.email)
    setEmailDisplay(json.data.emailMascarado)
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
      body: JSON.stringify({ email: emailReal, code }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error?.message ?? 'Código inválido.'); return }

    await fetchSession()
    router.push(redirect)
    router.refresh()
  }, [otp, emailReal, fetchSession, router, redirect])

  const handleOtpChange = (index: number, value: string) => {
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
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {etapa === 'email' && (
          <>
            <h1 className="font-heading" style={{ fontSize: '48px', marginBottom: '8px' }}>CRIAR CONTA</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '40px' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--foreground-primary)', textDecoration: 'underline' }}>Entrar</Link>
            </p>

            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-field">
                <label>E-MAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
              </div>

              {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'ENVIANDO CÓDIGO...' : 'CONTINUAR'}
              </button>

              <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', textAlign: 'center' }}>
                Ao continuar, você confirma que leu e aceita nossos termos de uso.
              </p>
            </form>
          </>
        )}

        {etapa === 'otp' && (
          <>
            <button
              onClick={() => { setEtapa('email'); setOtp(['','','','','','']); setError(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: '12px', marginBottom: '32px', padding: 0 }}
            >
              <ArrowLeft size={14} /> VOLTAR
            </button>

            <h1 className="font-heading" style={{ fontSize: '40px', marginBottom: '8px' }}>CONFIRME SEU E-MAIL</h1>
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
                    width: '52px', height: '60px', textAlign: 'center',
                    fontSize: '24px', fontWeight: 700,
                    fontFamily: 'var(--font-geist-mono)',
                    border: `2px solid ${digit ? 'var(--foreground-primary)' : 'var(--border-light)'}`,
                    background: 'var(--surface-primary)', outline: 'none', transition: 'border-color 0.15s',
                  }}
                />
              ))}
            </div>

            {loading && <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginBottom: '16px' }}>Verificando...</p>}
            {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <div style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              {countdown > 0 ? (
                <span>Reenviar em {countdown}s</span>
              ) : (
                <button onClick={handleRequestOtp as unknown as React.MouseEventHandler} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--foreground-primary)', textDecoration: 'underline', padding: 0 }}>
                  Reenviar código
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

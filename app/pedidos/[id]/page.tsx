'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'

interface ItemPedido {
  id: number
  nomeProduto: string
  imagemProduto: string | null
  quantidade: number
  precoUnit: number
  subtotal: number
}

interface Pedido {
  id: number
  status: string
  total: number
  createdAt: string
  itens: ItemPedido[]
}

type OtpFase = 'enviando' | 'aguardando' | 'verificado' | 'erro'

const STATUS_LABEL: Record<string, string> = {
  pendente:  'PENDENTE',
  pago:      'PAGO',
  enviado:   'ENVIADO',
  entregue:  'ENTREGUE',
  cancelado: 'CANCELADO',
}

const STATUS_COLOR: Record<string, string> = {
  pendente:  '#B7791F',
  pago:      '#2B6CB0',
  enviado:   '#6B46C1',
  entregue:  '#276749',
  cancelado: '#9B2C2C',
}

const RETORNO_MP: Record<string, { icon: React.ReactNode; titulo: string; mensagem: string; cor: string }> = {
  sucesso: {
    icon: <CheckCircle size={20} />,
    titulo: 'Pagamento confirmado!',
    mensagem: 'Seu pedido foi aprovado e está sendo preparado.',
    cor: '#276749',
  },
  falha: {
    icon: <XCircle size={20} />,
    titulo: 'Pagamento não aprovado',
    mensagem: 'Houve um problema com o pagamento. Tente novamente.',
    cor: '#9B2C2C',
  },
  pendente: {
    icon: <Clock size={20} />,
    titulo: 'Pagamento em análise',
    mensagem: 'Seu pagamento está sendo processado. Avisaremos quando confirmado.',
    cor: '#B7791F',
  },
}

export default function PedidoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const retorno = searchParams.get('status')

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // OTP pós-compra
  const [otpFase, setOtpFase] = useState<OtpFase>('enviando')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpEmailMascarado, setOtpEmailMascarado] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setPedido(j.data)
        else setErro(j.error?.message ?? 'Erro ao carregar pedido.')
        setLoading(false)
      })
      .catch(() => { setErro('Erro de conexão.'); setLoading(false) })
  }, [id])

  // Auto-envia OTP quando o pedido foi confirmado com sucesso
  const enviarOtp = useCallback(() => {
    setOtpFase('enviando')
    setOtpError(null)

    fetch('/api/auth/otp/enviar', { method: 'POST' })
      .then(r => r.json())
      .then(j => {
        if (!j.success) { setOtpFase('erro'); return }
        setOtpEmail(j.data.email)
        setOtpEmailMascarado(j.data.emailMascarado)
        setOtpFase('aguardando')
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      })
      .catch(() => setOtpFase('erro'))
  }, [])

  useEffect(() => {
    if (retorno === 'sucesso' && pedido) enviarOtp()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retorno, pedido])

  const handleVerifyOtp = useCallback(async (digits?: string[]) => {
    const code = (digits ?? otpDigits).join('')
    if (code.length < 6) return

    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, code }),
    })

    const json = await res.json()
    if (!res.ok) { setOtpError(json.error?.message ?? 'Código inválido.'); return }

    setOtpFase('verificado')
  }, [otpDigits, otpEmail])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otpDigits]
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d })
      setOtpDigits(newOtp)
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus()
      if (newOtp.every(d => d !== '')) handleVerifyOtp(newOtp)
      return
    }
    const digit = value.replace(/\D/g, '')
    const newOtp = [...otpDigits]
    newOtp[index] = digit
    setOtpDigits(newOtp)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (newOtp.every(d => d !== '')) handleVerifyOtp(newOtp)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px' }}>
        <p style={{ color: 'var(--foreground-secondary)' }}>Carregando...</p>
      </div>
    )
  }

  if (erro || !pedido) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px' }}>
        <p style={{ color: '#e53e3e', marginBottom: '24px' }}>{erro ?? 'Pedido não encontrado.'}</p>
        <Link href="/pedidos" className="btn">MEUS PEDIDOS</Link>
      </div>
    )
  }

  const banner = retorno ? RETORNO_MP[retorno] : null
  const statusColor = STATUS_COLOR[pedido.status] ?? 'var(--foreground-secondary)'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px' }}>

      {/* Banner de retorno do Mercado Pago */}
      {banner && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '16px 20px', marginBottom: '24px',
          background: `${banner.cor}12`, border: `1px solid ${banner.cor}40`,
          color: banner.cor,
        }}>
          {banner.icon}
          <div>
            <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{banner.titulo}</p>
            <p style={{ fontSize: '13px', opacity: 0.85 }}>{banner.mensagem}</p>
          </div>
        </div>
      )}

      {/* ── Seção OTP pós-compra ── */}
      {retorno === 'sucesso' && (
        <div style={{
          padding: '24px', marginBottom: '32px',
          border: '1px solid var(--border-light)',
          background: 'var(--surface-primary)',
        }}>
          {otpFase === 'enviando' && (
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              Enviando código de acesso...
            </p>
          )}

          {otpFase === 'aguardando' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <UserCheck size={18} style={{ color: 'var(--foreground-primary)', flexShrink: 0 }} />
                <h3 className="font-heading" style={{ fontSize: '18px' }}>ACESSE SUA CONTA</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginBottom: '20px' }}>
                Enviamos um código de 6 dígitos para <strong>{otpEmailMascarado}</strong>.
                Use-o para acessar seus pedidos e dados a qualquer momento.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {otpDigits.map((digit, i) => (
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
                      width: '48px', height: '56px', textAlign: 'center',
                      fontSize: '22px', fontWeight: 700,
                      fontFamily: 'var(--font-geist-mono)',
                      border: `2px solid ${digit ? 'var(--foreground-primary)' : 'var(--border-light)'}`,
                      background: 'var(--surface-primary)', outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              {otpError && (
                <p style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '12px' }}>{otpError}</p>
              )}

              <button
                onClick={() => { setOtpDigits(['','','','','','']); setOtpError(null); enviarOtp() }}
                style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Reenviar código
              </button>
            </>
          )}

          {otpFase === 'verificado' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} style={{ color: '#276749', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#276749', marginBottom: '4px' }}>
                  Conta confirmada!
                </p>
                <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                  Acompanhe seus pedidos em{' '}
                  <Link href="/minha-conta/pedidos" style={{ color: 'var(--foreground-primary)', textDecoration: 'underline' }}>
                    Minha Conta
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {otpFase === 'erro' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                Não foi possível enviar o código.{' '}
                <button
                  onClick={enviarOtp}
                  style={{ color: 'var(--foreground-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: 0 }}
                >
                  Tentar novamente
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/pedidos"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--foreground-secondary)', textDecoration: 'none', marginBottom: '24px' }}
        >
          <ArrowLeft size={14} /> MEUS PEDIDOS
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="font-heading" style={{ fontSize: '36px', marginBottom: '4px' }}>
              PEDIDO #{String(pedido.id).padStart(5, '0')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              {fmtDate(pedido.createdAt)}
            </p>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
            color: statusColor,
            background: `${statusColor}18`,
            padding: '6px 14px',
            alignSelf: 'flex-start',
          }}>
            {STATUS_LABEL[pedido.status] ?? pedido.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="divider" style={{ marginBottom: '32px' }} />

      {/* Itens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {pedido.itens.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {item.imagemProduto ? (
              <Image src={item.imagemProduto} alt={item.nomeProduto} width={72} height={72} style={{ objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 72, height: 72, background: 'var(--surface-light)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{item.nomeProduto}</p>
              <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--foreground-secondary)' }}>
                {item.quantidade}x {fmt(item.precoUnit)}
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
              {fmt(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <div className="divider" style={{ marginBottom: '24px' }} />

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '20px', fontWeight: 700 }}>
          {fmt(pedido.total)}
        </span>
      </div>

    </div>
  )
}

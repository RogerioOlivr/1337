'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Truck, Mail, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'
import { useSessionStore } from '@/src/store/sessionStore'

type Etapa = 'identificacao' | 'aguardando-link' | 'confirmacao'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const { user, checked, fetchSession } = useSessionStore()

  const [etapa, setEtapa] = useState<Etapa>('identificacao')
  const [email, setEmail] = useState('')
  const [magicLinkDev, setMagicLinkDev] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Se já estiver logado, pula direto para confirmação
  useEffect(() => {
    if (!checked) fetchSession()
    if (checked && user) setEtapa('confirmacao')
  }, [checked, user, fetchSession])

  // Passo 1 — solicita magic link
  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect: '/checkout' }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message ?? 'Erro ao enviar link.')
      setLoading(false)
      return
    }

    // Em desenvolvimento a API retorna o link direto para facilitar teste
    if (json.data?.magicLink) setMagicLinkDev(json.data.magicLink)

    setEtapa('aguardando-link')
    setLoading(false)
  }

  // Passo 3 — cria pedido e vai para MP
  const handleConfirmar = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    setError(null)

    try {
      const pedidoRes = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: items.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        }),
      })

      const pedidoJson = await pedidoRes.json()
      if (!pedidoRes.ok) {
        setError(pedidoJson.error?.message ?? 'Erro ao criar pedido.')
        setSubmitting(false)
        return
      }

      const pagRes = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedidoJson.data.id }),
      })

      const pagJson = await pagRes.json()
      if (!pagRes.ok) {
        setError(pagJson.error?.message ?? 'Erro ao iniciar pagamento.')
        setSubmitting(false)
        return
      }

      clearCart()
      window.location.href = pagJson.data.checkoutUrl
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <nav className="checkout-navbar">
        <Link href="/" className="logo font-heading" style={{ textDecoration: 'none', color: 'var(--foreground-primary)' }}>
          1337
        </Link>
        <div className="secure">
          <Lock size={16} />
          <span>COMPRA SEGURA</span>
        </div>
      </nav>
      <div className="divider" />

      <div className="checkout-body">
        {/* ── Lado esquerdo ── */}
        <div className="checkout-form">

          {/* ETAPA 1 — Identificação */}
          {etapa === 'identificacao' && (
            <div className="form-section">
              <h2 className="font-heading">IDENTIFICAÇÃO</h2>
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginBottom: '24px' }}>
                Informe seu e-mail para continuar. Enviaremos um link de acesso — sem precisar de senha.
              </p>

              <form onSubmit={handleRequestLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-field">
                  <label>E-MAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                  />
                </div>

                {error && <p style={{ color: '#e53e3e', fontSize: '13px' }}>{error}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'ENVIANDO...' : 'CONTINUAR COM E-MAIL'}
                </button>
              </form>
            </div>
          )}

          {/* ETAPA 2 — Aguardando clique no link */}
          {etapa === 'aguardando-link' && (
            <div className="form-section" style={{ textAlign: 'center', padding: '32px 0' }}>
              <Mail size={48} style={{ margin: '0 auto 16px', color: 'var(--foreground-secondary)' }} />
              <h2 className="font-heading" style={{ fontSize: '28px', marginBottom: '12px' }}>VERIFIQUE SEU E-MAIL</h2>
              <p style={{ fontSize: '14px', color: 'var(--foreground-secondary)', maxWidth: '360px', margin: '0 auto 24px' }}>
                Enviamos um link de acesso para <strong>{email}</strong>.<br />
                Clique no link para continuar sua compra.
              </p>

              {/* Link visível APENAS em desenvolvimento */}
              {magicLinkDev && (
                <div style={{
                  marginTop: '24px', padding: '16px',
                  background: 'var(--surface-light)',
                  border: '1px solid var(--border-light)',
                  textAlign: 'left',
                }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--foreground-secondary)', marginBottom: '8px' }}>
                    🛠 AMBIENTE DE DESENVOLVIMENTO — LINK DE ACESSO:
                  </p>
                  <a
                    href={magicLinkDev}
                    style={{ fontSize: '12px', color: 'var(--foreground-primary)', wordBreak: 'break-all', textDecoration: 'underline' }}
                  >
                    {magicLinkDev}
                  </a>
                </div>
              )}

              <button
                onClick={() => { setEtapa('identificacao'); setMagicLinkDev(null) }}
                style={{ marginTop: '24px', fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Usar outro e-mail
              </button>
            </div>
          )}

          {/* ETAPA 3 — Confirmação (autenticado) */}
          {etapa === 'confirmacao' && (
            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <CheckCircle size={20} style={{ color: '#276749', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--foreground-secondary)' }}>IDENTIFICADO COMO</p>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{user?.nome} · {user?.email}</p>
                </div>
              </div>

              <div className="divider" style={{ marginBottom: '24px' }} />

              <h2 className="font-heading" style={{ marginBottom: '16px' }}>CONFIRMAR PEDIDO</h2>
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', marginBottom: '24px' }}>
                Ao confirmar, você será redirecionado para o pagamento seguro via Mercado Pago.
              </p>

              {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

              {items.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                  Seu carrinho está vazio.{' '}
                  <Link href="/produtos" style={{ textDecoration: 'underline' }}>Ver coleção</Link>
                </p>
              ) : (
                <button className="btn-primary" onClick={handleConfirmar} disabled={submitting}>
                  {submitting ? 'PROCESSANDO...' : `CONFIRMAR PEDIDO — ${fmt(total())}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Resumo ── */}
        <div className="order-summary">
          <h2 className="font-heading">RESUMO</h2>
          <div className="divider" />

          {items.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', padding: '16px 0' }}>Nenhum item no carrinho.</p>
          ) : (
            items.map((item) => (
              <div key={item.produtoId} className="summary-item">
                {item.imagem ? (
                  <Image src={item.imagem} alt={item.nome} width={64} height={64} style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 64, height: 64, background: 'var(--surface-light)' }} />
                )}
                <div className="summary-item-info">
                  <h4>{item.nome}</h4>
                  <span className="detail">Qtd: {item.quantidade}</span>
                </div>
                <span className="item-price font-caption">{fmt(item.preco * item.quantidade)}</span>
              </div>
            ))
          )}

          <div className="divider" />
          <div className="summary-totals">
            <div className="row"><span className="label">Subtotal</span><span className="value">{fmt(total())}</span></div>
            <div className="row"><span className="label">Frete</span><span className="value">Grátis</span></div>
            <div className="divider" />
            <div className="total"><span className="label">Total</span><span className="value">{fmt(total())}</span></div>
          </div>

          <div className="delivery-note">
            <Truck size={16} style={{ flexShrink: 0, color: 'var(--foreground-secondary)' }} />
            <span>Entrega estimada: 3-5 dias úteis</span>
          </div>
        </div>
      </div>
    </>
  )
}

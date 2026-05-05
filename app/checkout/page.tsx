'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Truck, Mail } from 'lucide-react'
import { useCartStore } from '@/src/store/cartStore'
import { useSessionStore } from '@/src/store/sessionStore'

type Etapa = 'email' | 'aguardando-link' | 'dados' | 'entrega' | 'pagamento'

interface DadosPessoais {
  nome: string
  sobrenome: string
  ddi: string
  telefone: string
  cpf: string
}

interface DadosEntrega {
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

const stepOrder: Exclude<Etapa, 'aguardando-link'>[] = ['email', 'dados', 'entrega', 'pagamento']

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const { user, checked, fetchSession } = useSessionStore()

  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState('')
  const [dados, setDados] = useState<DadosPessoais>({ nome: '', sobrenome: '', ddi: '+55', telefone: '', cpf: '' })
  const [entrega, setEntrega] = useState<DadosEntrega>({ cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => {
    if (!checked) fetchSession()
  }, [checked, fetchSession])

  useEffect(() => {
    if (checked && user && (etapa === 'email' || etapa === 'aguardando-link')) {
      setEmail(user.email)
      setEtapa('dados')
    }
  }, [checked, user, etapa])

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
    setLoading(false)

    if (!res.ok) {
      setError(json.error?.message ?? 'Erro ao enviar link.')
      return
    }

    if (json.data?.magicLink) {
      console.log('[DEV] Magic Link:', json.data.magicLink)
    }

    setEtapa('aguardando-link')
  }

  const handleDados = (e: React.FormEvent) => {
    e.preventDefault()
    setEtapa('entrega')
  }

  const handleEntrega = (e: React.FormEvent) => {
    e.preventDefault()
    setEtapa('pagamento')
  }

  const handleCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setEntrega(d => ({ ...d, cep: raw }))
    setCepError(null)

    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const json = await res.json()

      if (json.erro) {
        setCepError('CEP não encontrado.')
        setCepLoading(false)
        return
      }

      setEntrega(d => ({
        ...d,
        endereco: json.logradouro ?? '',
        bairro: json.bairro ?? '',
        cidade: json.localidade ?? '',
        estado: json.uf ?? '',
      }))
    } catch {
      setCepError('Erro ao buscar CEP. Verifique sua conexão.')
    } finally {
      setCepLoading(false)
    }
  }

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

  const stepStatus = (step: number): 'active' | 'done' | 'disabled' => {
    const currentIdx = stepOrder.indexOf(etapa === 'aguardando-link' ? 'email' : etapa)
    if (step - 1 === currentIdx) return 'active'
    if (step - 1 < currentIdx) return 'done'
    return 'disabled'
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

          {/* Tela de aguardo de e-mail (fora do accordion) */}
          {etapa === 'aguardando-link' ? (
            <div className="form-section" style={{ textAlign: 'center', padding: '40px 0' }}>
              <Mail size={40} style={{ margin: '0 auto 16px', color: 'var(--foreground-secondary)' }} />
              <h2 className="font-heading" style={{ fontSize: '28px', marginBottom: '12px' }}>VERIFIQUE SEU E-MAIL</h2>
              <p style={{ fontSize: '14px', color: 'var(--foreground-secondary)', maxWidth: '360px', margin: '0 auto 24px' }}>
                Enviamos um link de acesso para <strong>{email}</strong>.<br />
                Clique no link para continuar sua compra.
              </p>
              <button
                onClick={() => setEtapa('email')}
                style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <div className="checkout-steps">

              {/* ── Step 1: Identificação ── */}
              <div className={`checkout-step step--${stepStatus(1)}`}>
                <div className="step-header" onClick={() => stepStatus(1) === 'done' && setEtapa('email')}>
                  <span className="step-number">01</span>
                  <div className="step-header-content">
                    <span className="step-title font-heading">IDENTIFICAÇÃO</span>
                    {stepStatus(1) === 'done' && <span className="step-summary">{email}</span>}
                  </div>
                  {stepStatus(1) === 'done' && (
                    <button className="step-edit-btn" onClick={(e) => { e.stopPropagation(); setEtapa('email') }}>
                      Editar
                    </button>
                  )}
                </div>

                {stepStatus(1) === 'active' && (
                  <div className="step-body">
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
              </div>

              {/* ── Step 2: Dados Pessoais ── */}
              <div className={`checkout-step step--${stepStatus(2)}`}>
                <div className="step-header" onClick={() => stepStatus(2) === 'done' && setEtapa('dados')}>
                  <span className="step-number">02</span>
                  <div className="step-header-content">
                    <span className="step-title font-heading">DADOS PESSOAIS</span>
                    {stepStatus(2) === 'done' && (
                      <span className="step-summary">{dados.nome} {dados.sobrenome} · {dados.ddi} {dados.telefone}</span>
                    )}
                  </div>
                  {stepStatus(2) === 'done' && (
                    <button className="step-edit-btn" onClick={(e) => { e.stopPropagation(); setEtapa('dados') }}>
                      Editar
                    </button>
                  )}
                </div>

                {stepStatus(2) === 'active' && (
                  <div className="step-body">
                    <form onSubmit={handleDados} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-row">
                        <div className="form-field">
                          <label>NOME</label>
                          <input
                            value={dados.nome}
                            onChange={(e) => setDados(d => ({ ...d, nome: e.target.value }))}
                            placeholder="Nome"
                            required
                            autoFocus
                          />
                        </div>
                        <div className="form-field">
                          <label>SOBRENOME</label>
                          <input
                            value={dados.sobrenome}
                            onChange={(e) => setDados(d => ({ ...d, sobrenome: e.target.value }))}
                            placeholder="Sobrenome"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-field w-fixed-sm">
                          <label>DDI</label>
                          <input
                            value={dados.ddi}
                            onChange={(e) => setDados(d => ({ ...d, ddi: e.target.value }))}
                            placeholder="+55"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>TELEFONE</label>
                          <input
                            value={dados.telefone}
                            onChange={(e) => setDados(d => ({ ...d, telefone: e.target.value }))}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-field">
                        <label>CPF</label>
                        <input
                          value={dados.cpf}
                          onChange={(e) => setDados(d => ({ ...d, cpf: e.target.value }))}
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary">IR PARA ENTREGA</button>
                    </form>
                  </div>
                )}
              </div>

              {/* ── Step 3: Entrega ── */}
              <div className={`checkout-step step--${stepStatus(3)}`}>
                <div className="step-header" onClick={() => stepStatus(3) === 'done' && setEtapa('entrega')}>
                  <span className="step-number">03</span>
                  <div className="step-header-content">
                    <span className="step-title font-heading">ENTREGA</span>
                    {stepStatus(3) === 'done' && (
                      <span className="step-summary">
                        {entrega.endereco}, {entrega.numero} — {entrega.cidade}/{entrega.estado}
                      </span>
                    )}
                  </div>
                  {stepStatus(3) === 'done' && (
                    <button className="step-edit-btn" onClick={(e) => { e.stopPropagation(); setEtapa('entrega') }}>
                      Editar
                    </button>
                  )}
                </div>

                {stepStatus(3) === 'active' && (
                  <div className="step-body">
                    <form onSubmit={handleEntrega} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-row">
                        <div className="form-field w-fixed-md">
                          <label>CEP{cepLoading && <span style={{ marginLeft: 8, fontWeight: 400, letterSpacing: 0 }}>buscando...</span>}</label>
                          <input
                            value={entrega.cep}
                            onChange={(e) => handleCep(e.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                            required
                            autoFocus
                          />
                          {cepError && <span style={{ fontSize: '11px', color: '#e53e3e' }}>{cepError}</span>}
                        </div>
                        <div className="form-field">
                          <label>ENDEREÇO</label>
                          <input
                            value={entrega.endereco}
                            onChange={(e) => setEntrega(d => ({ ...d, endereco: e.target.value }))}
                            placeholder="Rua, Avenida..."
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-field w-fixed-sm">
                          <label>NÚMERO</label>
                          <input
                            value={entrega.numero}
                            onChange={(e) => setEntrega(d => ({ ...d, numero: e.target.value }))}
                            placeholder="123"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>COMPLEMENTO</label>
                          <input
                            value={entrega.complemento}
                            onChange={(e) => setEntrega(d => ({ ...d, complemento: e.target.value }))}
                            placeholder="Apto, Bloco... (opcional)"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-field">
                          <label>BAIRRO</label>
                          <input
                            value={entrega.bairro}
                            onChange={(e) => setEntrega(d => ({ ...d, bairro: e.target.value }))}
                            placeholder="Bairro"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>CIDADE</label>
                          <input
                            value={entrega.cidade}
                            onChange={(e) => setEntrega(d => ({ ...d, cidade: e.target.value }))}
                            placeholder="Cidade"
                            required
                          />
                        </div>
                        <div className="form-field w-fixed-sm">
                          <label>ESTADO</label>
                          <input
                            value={entrega.estado}
                            onChange={(e) => setEntrega(d => ({ ...d, estado: e.target.value }))}
                            placeholder="SP"
                            maxLength={2}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary">IR PARA PAGAMENTO</button>
                    </form>
                  </div>
                )}
              </div>

              {/* ── Step 4: Pagamento ── */}
              <div className={`checkout-step step--${stepStatus(4)}`}>
                <div className="step-header">
                  <span className="step-number">04</span>
                  <div className="step-header-content">
                    <span className="step-title font-heading">PAGAMENTO</span>
                  </div>
                </div>

                {stepStatus(4) === 'active' && (
                  <div className="step-body">
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
                        {submitting ? 'PROCESSANDO...' : `CONFIRMAR E PAGAR — ${fmt(total())}`}
                      </button>
                    )}
                  </div>
                )}
              </div>

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

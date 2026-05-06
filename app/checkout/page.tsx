'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Truck, Mail, CheckCircle } from 'lucide-react'
import { initMercadoPago, Payment as MpPayment } from '@mercadopago/sdk-react'
import type { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type'
import { useCartStore } from '@/src/store/cartStore'
import { useSessionStore } from '@/src/store/sessionStore'

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, { locale: 'pt-BR' })

// ─── Types ───────────────────────────────────────────────────────────────────

type Etapa = 'email' | 'aguardando-link' | 'dados' | 'entrega' | 'pagamento'

interface DadosPessoais {
  nome: string
  sobrenome: string
  telefone: string
  cpf: string
}

interface EnderecoForm {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

interface EnderecoSalvo {
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

const ENDERECO_VAZIO: EnderecoForm = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
}

const stepOrder: Exclude<Etapa, 'aguardando-link'>[] = ['email', 'dados', 'entrega', 'pagamento']

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const { user, checked, fetchSession } = useSessionStore()
  const router = useRouter()

  // Etapa atual do accordion
  const [etapa, setEtapa] = useState<Etapa>('email')

  // Dados do formulário
  const [email, setEmail] = useState('')
  const [dados, setDados] = useState<DadosPessoais>({ nome: '', sobrenome: '', telefone: '', cpf: '' })
  const [enderecoForm, setEnderecoForm] = useState<EnderecoForm>(ENDERECO_VAZIO)

  // Endereços salvos no banco (usuários logados)
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([])
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(null)
  const [usandoNovoEndereco, setUsandoNovoEndereco] = useState(false)

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const [contextoCarregado, setContextoCarregado] = useState(false)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ─── Carrega sessão ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!checked) fetchSession()
  }, [checked, fetchSession])

  // ─── Ao autenticar: carrega contexto do checkout ─────────────────────────

  useEffect(() => {
    if (!checked || !user) return
    if (etapa !== 'email' && etapa !== 'aguardando-link') return

    setEmail(user.email)

    fetch('/api/checkout/contexto')
      .then(r => r.json())
      .then(j => {
        if (!j.success) { setEtapa('dados'); return }

        const { usuario, enderecos } = j.data

        // Pré-preenche dados pessoais com o que já existe no banco
        const partes = usuario.nome.trim().split(/\s+/)
        setDados({
          nome: partes[0] ?? '',
          sobrenome: partes.slice(1).join(' '),
          telefone: usuario.telefone ?? '',
          cpf: usuario.cpf ?? '',
        })

        setEnderecosSalvos(enderecos)
        setContextoCarregado(true)

        // Define o endereço padrão como selecionado
        const padrao = enderecos.find((e: EnderecoSalvo) => e.padrao) ?? enderecos[0] ?? null
        if (padrao) setEnderecoSelecionadoId(padrao.id)

        // Decide qual etapa abrir
        const dadosCompletos = !!(usuario.cpf && usuario.telefone)
        const temEndereco = enderecos.length > 0

        if (dadosCompletos && temEndereco) {
          setEtapa('pagamento')        // Tudo pronto → direto ao pagamento
        } else if (dadosCompletos) {
          setEtapa('entrega')          // Só falta endereço
        } else {
          setEtapa('dados')            // Faltam dados pessoais
        }
      })
      .catch(() => setEtapa('dados'))
  }, [checked, user, etapa])

  // ─── Handlers de step ────────────────────────────────────────────────────

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

    if (!res.ok) { setError(json.error?.message ?? 'Erro ao enviar link.'); return }
    if (json.data?.magicLink) console.log('[DEV] Magic Link:', json.data.magicLink)

    setEtapa('aguardando-link')
  }

  const handleDados = async (e: React.FormEvent) => {
    e.preventDefault()

    // Salva CPF e telefone no banco
    await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: `${dados.nome} ${dados.sobrenome}`.trim(),
        cpf: dados.cpf,
        telefone: dados.telefone,
      }),
    })

    setEtapa('entrega')
  }

  const handleEntrega = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!usandoNovoEndereco && enderecoSelecionadoId) {
      // Usa endereço já salvo
      setEtapa('pagamento')
      return
    }

    // Salva novo endereço no banco e seleciona
    const res = await fetch('/api/enderecos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...enderecoForm,
        padrao: enderecosSalvos.length === 0, // primeiro endereço vira padrão
      }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error?.message ?? 'Erro ao salvar endereço.'); return }

    const novo: EnderecoSalvo = json.data
    setEnderecosSalvos(prev => [...prev, novo])
    setEnderecoSelecionadoId(novo.id)
    setUsandoNovoEndereco(false)
    setEtapa('pagamento')
  }

  const handlePagar = async ({ formData }: IPaymentFormData) => {
    const pedidoRes = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: items.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        enderecoId: enderecoSelecionadoId ?? undefined,
      }),
    })

    const pedidoJson = await pedidoRes.json()
    if (!pedidoRes.ok) throw new Error(pedidoJson.error?.message ?? 'Erro ao criar pedido.')

    const pedidoId = pedidoJson.data.id

    const pagRes = await fetch('/api/pagamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId, formData }),
    })

    const pagJson = await pagRes.json()
    if (!pagRes.ok) throw new Error(pagJson.error?.message ?? 'Erro ao processar pagamento.')

    const { status } = pagJson.data
    if (status === 'rejected') throw new Error('Pagamento recusado. Verifique os dados e tente novamente.')

    clearCart()
    router.push(`/pedidos/${pedidoId}?status=${status === 'approved' ? 'sucesso' : 'pendente'}`)
  }

  // ─── CEP ────────────────────────────────────────────────────────────────

  const handleCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setEnderecoForm(d => ({ ...d, cep: raw }))
    setCepError(null)

    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const json = await res.json()
      if (json.erro) { setCepError('CEP não encontrado.'); return }
      setEnderecoForm(d => ({
        ...d,
        logradouro: json.logradouro ?? '',
        bairro: json.bairro ?? '',
        cidade: json.localidade ?? '',
        estado: json.uf ?? '',
      }))
    } catch {
      setCepError('Erro ao buscar CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  // ─── Step status ─────────────────────────────────────────────────────────

  const stepStatus = (step: number): 'active' | 'done' | 'disabled' => {
    const idx = stepOrder.indexOf(etapa === 'aguardando-link' ? 'email' : etapa)
    if (step - 1 === idx) return 'active'
    if (step - 1 < idx) return 'done'
    return 'disabled'
  }

  // ─── Resumo dos steps colapsados ─────────────────────────────────────────

  const enderecoSelecionado = enderecosSalvos.find(e => e.id === enderecoSelecionadoId)

  const resumoEndereco = enderecoSelecionado
    ? `${enderecoSelecionado.logradouro}, ${enderecoSelecionado.numero} — ${enderecoSelecionado.cidade}/${enderecoSelecionado.estado}`
    : enderecoForm.logradouro
      ? `${enderecoForm.logradouro}, ${enderecoForm.numero} — ${enderecoForm.cidade}/${enderecoForm.estado}`
      : ''

  // ─── Render ──────────────────────────────────────────────────────────────

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
        <div className="checkout-form">

          {/* ── Aguardando magic link ── */}
          {etapa === 'aguardando-link' ? (
            <div className="form-section" style={{ textAlign: 'center', padding: '40px 0' }}>
              <Mail size={40} style={{ margin: '0 auto 16px', color: 'var(--foreground-secondary)' }} />
              <h2 className="font-heading" style={{ fontSize: '28px', marginBottom: '12px' }}>VERIFIQUE SEU E-MAIL</h2>
              <p style={{ fontSize: '14px', color: 'var(--foreground-secondary)', maxWidth: '360px', margin: '0 auto 24px' }}>
                Enviamos um link de acesso para <strong>{email}</strong>.<br />
                Clique no link para continuar sua compra.
              </p>
              <button onClick={() => setEtapa('email')} style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
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
                    <button className="step-edit-btn" onClick={e => { e.stopPropagation(); setEtapa('email') }}>Editar</button>
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
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
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
                      <span className="step-summary">{dados.nome} {dados.sobrenome} · {dados.telefone}</span>
                    )}
                  </div>
                  {stepStatus(2) === 'done' && (
                    <button className="step-edit-btn" onClick={e => { e.stopPropagation(); setEtapa('dados') }}>Editar</button>
                  )}
                </div>

                {stepStatus(2) === 'active' && (
                  <div className="step-body">
                    <form onSubmit={handleDados} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-row">
                        <div className="form-field">
                          <label>NOME</label>
                          <input value={dados.nome} onChange={e => setDados(d => ({ ...d, nome: e.target.value }))} placeholder="Nome" required autoFocus />
                        </div>
                        <div className="form-field">
                          <label>SOBRENOME</label>
                          <input value={dados.sobrenome} onChange={e => setDados(d => ({ ...d, sobrenome: e.target.value }))} placeholder="Sobrenome" required />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-field">
                          <label>TELEFONE</label>
                          <input value={dados.telefone} onChange={e => setDados(d => ({ ...d, telefone: e.target.value }))} placeholder="(11) 99999-9999" required />
                        </div>
                        <div className="form-field">
                          <label>CPF</label>
                          <input value={dados.cpf} onChange={e => setDados(d => ({ ...d, cpf: e.target.value }))} placeholder="000.000.000-00" required />
                        </div>
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
                    {stepStatus(3) === 'done' && resumoEndereco && (
                      <span className="step-summary">{resumoEndereco}</span>
                    )}
                  </div>
                  {stepStatus(3) === 'done' && (
                    <button className="step-edit-btn" onClick={e => { e.stopPropagation(); setEtapa('entrega') }}>Editar</button>
                  )}
                </div>

                {stepStatus(3) === 'active' && (
                  <div className="step-body">
                    <form onSubmit={handleEntrega} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      {/* Endereços salvos */}
                      {enderecosSalvos.length > 0 && !usandoNovoEndereco && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {enderecosSalvos.map(end => (
                            <label
                              key={end.id}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                padding: '14px 16px', border: `1px solid ${enderecoSelecionadoId === end.id ? 'var(--foreground-primary)' : 'var(--border-light)'}`,
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="radio"
                                name="endereco"
                                checked={enderecoSelecionadoId === end.id}
                                onChange={() => setEnderecoSelecionadoId(end.id)}
                                style={{ marginTop: '2px', flexShrink: 0 }}
                              />
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {end.logradouro}, {end.numero}{end.complemento ? `, ${end.complemento}` : ''}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>
                                  {end.bairro} · {end.cidade}/{end.estado} · CEP {end.cep}
                                </p>
                                {end.padrao && (
                                  <span style={{ fontSize: '10px', color: 'var(--foreground-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <CheckCircle size={10} /> Endereço padrão
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}

                          <button
                            type="button"
                            onClick={() => { setUsandoNovoEndereco(true); setEnderecoForm(ENDERECO_VAZIO) }}
                            style={{ alignSelf: 'flex-start', fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          >
                            + Usar outro endereço
                          </button>

                          <button type="submit" className="btn-primary">IR PARA PAGAMENTO</button>
                        </div>
                      )}

                      {/* Formulário de novo endereço */}
                      {(enderecosSalvos.length === 0 || usandoNovoEndereco) && (
                        <>
                          {usandoNovoEndereco && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Novo endereço</span>
                              <button type="button" onClick={() => setUsandoNovoEndereco(false)} style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                Usar endereço salvo
                              </button>
                            </div>
                          )}

                          <div className="form-row">
                            <div className="form-field w-fixed-md">
                              <label>CEP{cepLoading && <span style={{ marginLeft: 8, fontWeight: 400, letterSpacing: 0 }}>buscando...</span>}</label>
                              <input value={enderecoForm.cep} onChange={e => handleCep(e.target.value)} placeholder="00000-000" maxLength={9} required autoFocus />
                              {cepError && <span style={{ fontSize: '11px', color: '#e53e3e' }}>{cepError}</span>}
                            </div>
                            <div className="form-field">
                              <label>LOGRADOURO</label>
                              <input value={enderecoForm.logradouro} onChange={e => setEnderecoForm(d => ({ ...d, logradouro: e.target.value }))} placeholder="Rua, Avenida..." required />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-field w-fixed-sm">
                              <label>NÚMERO</label>
                              <input value={enderecoForm.numero} onChange={e => setEnderecoForm(d => ({ ...d, numero: e.target.value }))} placeholder="123" required />
                            </div>
                            <div className="form-field">
                              <label>COMPLEMENTO</label>
                              <input value={enderecoForm.complemento} onChange={e => setEnderecoForm(d => ({ ...d, complemento: e.target.value }))} placeholder="Apto, Bloco... (opcional)" />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-field">
                              <label>BAIRRO</label>
                              <input value={enderecoForm.bairro} onChange={e => setEnderecoForm(d => ({ ...d, bairro: e.target.value }))} placeholder="Bairro" required />
                            </div>
                            <div className="form-field">
                              <label>CIDADE</label>
                              <input value={enderecoForm.cidade} onChange={e => setEnderecoForm(d => ({ ...d, cidade: e.target.value }))} placeholder="Cidade" required />
                            </div>
                            <div className="form-field w-fixed-sm">
                              <label>ESTADO</label>
                              <input value={enderecoForm.estado} onChange={e => setEnderecoForm(d => ({ ...d, estado: e.target.value }))} placeholder="SP" maxLength={2} required />
                            </div>
                          </div>
                          <button type="submit" className="btn-primary">IR PARA PAGAMENTO</button>
                        </>
                      )}

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
                    {items.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                        Seu carrinho está vazio.{' '}
                        <Link href="/produtos" style={{ textDecoration: 'underline' }}>Ver coleção</Link>
                      </p>
                    ) : (
                      <MpPayment
                        initialization={{ amount: total() }}
                        customization={{
                          paymentMethods: {
                            creditCard: 'all',
                            debitCard: 'all',
                            ticket: 'all',
                            bankTransfer: 'all',
                          },
                        }}
                        onSubmit={handlePagar}
                        onError={err => console.error('[MP Brick]', err)}
                      />
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
            items.map(item => (
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

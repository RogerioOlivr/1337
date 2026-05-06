'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

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

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPedido(j.data)
        else setErro(j.error?.message ?? 'Erro ao carregar pedido.')
        setLoading(false)
      })
      .catch(() => {
        setErro('Erro de conexão.')
        setLoading(false)
      })
  }, [id])

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
          padding: '16px 20px', marginBottom: '32px',
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
        {pedido.itens.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {item.imagemProduto ? (
              <Image
                src={item.imagemProduto}
                alt={item.nomeProduto}
                width={72}
                height={72}
                style={{ objectFit: 'cover', flexShrink: 0 }}
              />
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'

interface Pedido {
  id: number
  status: string
  total: number
  quantidadeItens: number
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'PENDENTE', pago: 'PAGO', enviado: 'ENVIADO', entregue: 'ENTREGUE', cancelado: 'CANCELADO',
}
const STATUS_COLOR: Record<string, string> = {
  pendente: '#B7791F', pago: '#2B6CB0', enviado: '#6B46C1', entregue: '#276749', cancelado: '#9B2C2C',
}

export default function PedidosContaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pedidos')
      .then(r => r.json())
      .then(j => { setPedidos(j.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <p style={{ color: 'var(--foreground-secondary)', fontSize: '13px' }}>Carregando...</p>

  return (
    <div>
      <h1 className="font-heading" style={{ fontSize: '32px', marginBottom: '32px' }}>MEUS PEDIDOS</h1>

      {pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Package size={40} style={{ color: 'var(--foreground-secondary)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--foreground-secondary)', marginBottom: '20px', fontSize: '14px' }}>Nenhum pedido ainda.</p>
          <Link href="/produtos" className="btn">VER COLEÇÃO</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-light)' }}>
          {pedidos.map(p => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'var(--surface-primary)', gap: '16px', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '13px', fontWeight: 600 }}>
                    #{String(p.id).padStart(5, '0')}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: STATUS_COLOR[p.status], background: `${STATUS_COLOR[p.status]}18`, padding: '2px 8px' }}>
                    {STATUS_LABEL[p.status] ?? p.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                  {fmtDate(p.createdAt)} · {p.quantidadeItens} {p.quantidadeItens === 1 ? 'item' : 'itens'}
                </p>
              </div>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px', fontWeight: 600 }}>{fmt(p.total)}</span>
              <ChevronRight size={16} style={{ color: 'var(--foreground-secondary)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PEDIDO_STATUSES, isTransitionAllowed, type PedidoStatus } from '@/src/domain/pedido/statusMachine'

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente:  'PENDENTE',
  pago:      'PAGO',
  enviado:   'ENVIADO',
  entregue:  'ENTREGUE',
  cancelado: 'CANCELADO',
}

const STATUS_STYLE: Record<PedidoStatus, { bg: string; color: string }> = {
  pendente:  { bg: '#FEF3C7', color: '#92400E' },
  pago:      { bg: '#DBEAFE', color: '#1E40AF' },
  enviado:   { bg: '#EDE9FE', color: '#5B21B6' },
  entregue:  { bg: '#D1FAE5', color: '#065F46' },
  cancelado: { bg: '#FEE2E2', color: '#991B1B' },
}

interface Props {
  pedidoId: number
  statusAtual: PedidoStatus
}

export function StatusSelect({ pedidoId, statusAtual }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<PedidoStatus>(statusAtual)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transicoes = PEDIDO_STATUSES.filter(s => isTransitionAllowed(statusAtual, s))
  const style = STATUS_STYLE[status]

  const handleSave = async () => {
    if (status === statusAtual) return
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/admin/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error?.message ?? 'Erro ao atualizar status.')
      setStatus(statusAtual)
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
          padding: '4px 10px',
          background: style.bg,
          color: style.color,
        }}>
          {STATUS_LABEL[status]}
        </span>

        {transicoes.length > 0 && (
          <>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as PedidoStatus)}
              style={{
                fontSize: '12px', padding: '8px 12px',
                border: '1px solid var(--border-light)',
                background: '#fff', cursor: 'pointer',
              }}
            >
              <option value={statusAtual}>{STATUS_LABEL[statusAtual]} (atual)</option>
              {transicoes.map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>

            {status !== statusAtual && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  background: 'var(--foreground-primary)',
                  color: 'var(--foreground-inverse)',
                  border: 'none',
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                {saving ? 'SALVANDO...' : 'SALVAR'}
              </button>
            )}
          </>
        )}

        {transicoes.length === 0 && (
          <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
            Status final — nenhuma transição disponível
          </span>
        )}
      </div>

      {error && <p style={{ fontSize: '12px', color: '#991B1B' }}>{error}</p>}
    </div>
  )
}

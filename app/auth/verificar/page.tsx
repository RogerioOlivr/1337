'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/src/store/sessionStore'

type Estado = 'verificando' | 'sucesso' | 'erro'

export default function VerificarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchSession } = useSessionStore()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const redirect = searchParams.get('redirect') ?? '/checkout'

    if (!token) {
      setMensagem('Link inválido. Nenhum token encontrado.')
      setEstado('erro')
      return
    }

    fetch('/api/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then(async (json) => {
        if (json.success) {
          await fetchSession()
          setEstado('sucesso')
          // Pequena pausa para o usuário ver o feedback antes de redirecionar
          setTimeout(() => router.replace(redirect), 1200)
        } else {
          setMensagem(json.error?.message ?? 'Link inválido ou expirado.')
          setEstado('erro')
        }
      })
      .catch(() => {
        setMensagem('Erro de conexão. Tente novamente.')
        setEstado('erro')
      })
  }, [searchParams, fetchSession, router])

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        {estado === 'verificando' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
            <h1 className="font-heading" style={{ fontSize: '32px', marginBottom: '8px' }}>VERIFICANDO</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px' }}>Autenticando seu acesso...</p>
          </>
        )}

        {estado === 'sucesso' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
            <h1 className="font-heading" style={{ fontSize: '32px', marginBottom: '8px' }}>ACESSO CONFIRMADO</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px' }}>Redirecionando...</p>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✗</div>
            <h1 className="font-heading" style={{ fontSize: '32px', marginBottom: '8px' }}>LINK INVÁLIDO</h1>
            <p style={{ color: 'var(--foreground-secondary)', fontSize: '14px', marginBottom: '32px' }}>{mensagem}</p>
            <a href="/checkout" className="btn">TENTAR NOVAMENTE</a>
          </>
        )}
      </div>
    </div>
  )
}

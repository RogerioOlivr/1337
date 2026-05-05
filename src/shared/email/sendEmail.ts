export interface EmailPayload {
  to: string
  subject: string
  html: string
}

/**
 * Em desenvolvimento: imprime no console e retorna o link para facilitar testes.
 * Em produção: substituir pelo provedor de e-mail (Resend, SendGrid, etc.).
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    // TODO: integrar Resend ou outro provedor
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({ from: 'no-reply@1337.com', ...payload })
    throw new Error('Provedor de e-mail não configurado para produção.')
  }

  // Desenvolvimento: simula envio
  console.log('\n📧 ─────────────────────────────────────────')
  console.log(`   Para:     ${payload.to}`)
  console.log(`   Assunto:  ${payload.subject}`)
  console.log(`   Conteúdo: ${payload.html.replace(/<[^>]+>/g, '')}`)
  console.log('─────────────────────────────────────────────\n')
}

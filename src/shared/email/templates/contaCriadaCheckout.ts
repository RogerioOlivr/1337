interface ContaCriadaCheckoutInput {
  nomeCliente: string
  definirSenhaUrl: string
}

export function emailContaCriadaCheckout({ nomeCliente, definirSenhaUrl }: ContaCriadaCheckoutInput): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#111;padding:28px 40px;text-align:center">
            <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:4px">1337</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 0">
            <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 8px">Olá, ${nomeCliente}.</p>
            <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
              Uma conta foi criada automaticamente para você ao finalizar sua compra.
            </p>

            <div style="background:#f8f8f8;border-left:3px solid #111;padding:16px 20px;margin:0 0 24px">
              <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px">Como acessar sua conta</p>
              <p style="font-size:13px;color:#555;margin:0;line-height:1.7">
                Acesse <strong>1337.com.br</strong> e clique em <strong>Entrar</strong>.<br>
                Informe seu e-mail e você receberá um código de 6 dígitos para entrar — sem precisar de senha.
              </p>
            </div>

            <p style="font-size:13px;color:#555;margin:0 0 24px;line-height:1.6">
              Se preferir, você pode definir uma senha para facilitar acessos futuros.
              Este link é válido por <strong>72 horas</strong>:
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px">
              <tr>
                <td style="background:#111;padding:14px 28px">
                  <a href="${definirSenhaUrl}" style="font-size:13px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:1px">
                    DEFINIR SENHA
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#bbb;margin:0 0 40px;line-height:1.6">
              Se você não fez esta compra, entre em contato pelo e-mail contato@1337.com.br.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f0f0f0">
            <p style="font-size:11px;color:#bbb;text-align:center;margin:0">
              1337 — Premium Streetwear &nbsp;|&nbsp; contato@1337.com.br
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { full_name, email, password, give_platform, app_url } = await req.json()

        if (!email) throw new Error('E-mail do destinatário é obrigatório.')

        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) throw new Error('RESEND_API_KEY não configurada.')

        const platformUrl = app_url || 'https://app.institutobehn.com.br'
        const loginUrl = `${platformUrl}/login`

        const accessLine = give_platform
            ? `<li>✅ <strong>Acesso Completo</strong> à Plataforma Instituto Behn (todos os cursos e materiais)</li>`
            : `<li>✅ Acesso ao Ambiente da Plataforma Instituto Behn</li>`

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Você foi convidado — Instituto Behn</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.6);">INSTITUTO BEHN DE HIPNOSE E PNL</p>
              <h1 style="margin:12px 0 0;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;">Você foi Convidado! 🎉</h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:16px;">Bem-vindo(a) à nossa plataforma exclusiva</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.6;">
                Olá${full_name ? `, <strong>${full_name}</strong>` : ''}! 👋
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
                Você foi adicionado(a) à <strong>Plataforma do Instituto Behn</strong> pelo nosso time. Sua conta já está ativa e pronta para uso!
              </p>

              <!-- Access Box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:24px 0;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">Seus acessos incluem:</p>
                <ul style="margin:0;padding:0 0 0 18px;color:#334155;font-size:15px;line-height:2;">
                  ${accessLine}
                  <li>🧠 Cursos de Hipnose e PNL</li>
                  <li>📚 Materiais de Apoio</li>
                  <li>📅 Agenda de Eventos Exclusivos</li>
                </ul>
              </div>

              <!-- Credentials -->
              <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin:24px 0;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#1d4ed8;">Suas Credenciais de Acesso</p>
                <p style="margin:4px 0;font-size:15px;color:#1e3a5f;"><strong>E-mail:</strong> ${email}</p>
                ${password ? `<p style="margin:4px 0;font-size:15px;color:#1e3a5f;"><strong>Senha temporária:</strong> <code style="background:rgba(255,255,255,0.7);padding:2px 8px;border-radius:4px;font-family:monospace;">${password}</code></p>` : ''}
                <p style="margin:12px 0 0;font-size:12px;color:#3b82f6;">⚠️ Recomendamos alterar sua senha após o primeiro acesso.</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0 16px;">
                <a href="${loginUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;padding:16px 40px;border-radius:12px;letter-spacing:0.05em;box-shadow:0 4px 16px rgba(37,99,235,0.3);">
                  Acessar a Plataforma →
                </a>
              </div>

              <p style="margin:0;text-align:center;font-size:13px;color:#94a3b8;">
                Ou acesse diretamente: <a href="${loginUrl}" style="color:#2563eb;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Em caso de dúvidas, entre em contato pelo WhatsApp ou responda este e-mail.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;font-weight:700;letter-spacing:0.1em;">
                © ${new Date().getFullYear()} INSTITUTO BEHN DE HIPNOSE E PNL
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
            },
            body: JSON.stringify({
                from: 'Instituto Behn <contato@institutobehn.com.br>',
                to: email,
                subject: '🎉 Você foi convidado para a Plataforma Instituto Behn!',
                html
            })
        })

        const result = await emailResponse.json()
        console.log('[INVITE EMAIL] Resultado Resend:', result)

        if (!emailResponse.ok) {
            throw new Error(`Resend retornou erro: ${JSON.stringify(result)}`)
        }

        return new Response(JSON.stringify({ success: true, id: result.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('[INVITE EMAIL ERROR]', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

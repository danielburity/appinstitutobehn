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
        const { email, full_name, terms_type, course_title } = await req.json()

        if (!email) throw new Error('E-mail do destinatário é obrigatório.')

        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) throw new Error('RESEND_API_KEY não configurada.')

        const isAffiliate = terms_type === 'affiliate'
        const subject = isAffiliate
            ? '📋 Contrato de Associação — Instituto Behn'
            : `📋 Termos de Uso — ${course_title || 'Curso Instituto Behn'}`

        const termsTitle = isAffiliate
            ? 'Contrato de Associação ao Instituto Behn de Hipnose'
            : 'Termos de Uso e Contrato de Assinatura — Instituto Behn'

        const termsBody = isAffiliate ? AFFILIATE_TERMS_HTML : COURSE_TERMS_HTML

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
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
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.1;">📋 ${termsTitle}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.6;">
                Olá${full_name ? `, <strong>${full_name}</strong>` : ''}! 👋
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
                Conforme aceito durante a sua compra, segue abaixo o contrato completo para sua referência e arquivo pessoal.
              </p>

              <!-- Terms Content -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
                ${termsBody}
              </div>

              <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
                Este e-mail foi enviado automaticamente após a confirmação de sua compra na plataforma do Instituto Behn.
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
                subject,
                html
            })
        })

        const result = await emailResponse.json()
        console.log('[TERMS EMAIL] Resultado Resend:', result)

        if (!emailResponse.ok) {
            throw new Error(`Resend retornou erro: ${JSON.stringify(result)}`)
        }

        return new Response(JSON.stringify({ success: true, id: result.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('[TERMS EMAIL ERROR]', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

// ─── HTML-formatted terms content ───

const AFFILIATE_TERMS_HTML = `
<h3 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#1e3a5f;">CONTRATO DE ASSOCIAÇÃO AO INSTITUTO BEHN DE HIPNOSE</h3>

<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">
Pelo presente instrumento particular, de um lado o <strong>INSTITUTO BEHN DE HIPNOSE E PNL LTDA</strong>, inscrito no CNPJ sob o n. 49.177.308/0001-04, com sede na R Tte Gomes Ribeiro, 182, cj 124, CEP: 04.038-040, doravante denominado simplesmente INSTITUTO, e de outro lado, a pessoa física ou jurídica qualificada no formulário de associação, doravante denominada simplesmente AFILIADO.
</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">OBJETO:</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">O presente contrato tem como objeto a associação do AFILIADO ao INSTITUTO BEHN DE HIPNOSE, em forma de anuidade, que permitirá ao AFILIADO o acesso à plataforma online do Instituto com aulas gravadas, aulas ao vivo semanais e descontos em cursos e estabelecimentos parceiros.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">DIREITOS DO AFILIADO:</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">a) Acesso à plataforma online do Instituto;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">b) Participação em aulas ao vivo semanais;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">c) Descontos em cursos e estabelecimentos parceiros.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">DEVERES DO AFILIADO:</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">a) Pagamento da anuidade em até 12x via cartão de crédito;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">b) Comunicar cancelamento de cartão imediatamente;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">c) Uso exclusivo para estudo e desenvolvimento pessoal;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">d) Não compartilhar senha de acesso;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">e) Respeitar normas e código de ética;</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">f) Manter sigilo de informações e conteúdos.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">VIGÊNCIA E RESCISÃO:</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Vigência de 1 ano com renovação automática. Pré-aviso de 30 dias para não renovação. Direito de arrependimento de 7 dias conforme Art. 49 do CDC.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">PROPRIEDADE INTELECTUAL:</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Todo conteúdo é propriedade exclusiva do Instituto Behn. Proibido compartilhamento, download, cópia ou revenda.</p>

<p style="font-size:13px;color:#475569;line-height:1.8;margin:16px 0 0;font-weight:700;">INSTITUTO BEHN DE HIPNOSE</p>
`

const COURSE_TERMS_HTML = `
<h3 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#1e3a5f;">TERMOS DE USO E CONTRATO DE ASSINATURA — INSTITUTO BEHN</h3>

<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">
Este documento estabelece os termos e condições para a utilização da plataforma digital, cursos e vitrine de terapeutas do <strong>Instituto Behn</strong>.
</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">1. Do Objeto</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Concessão de licença de uso pessoal e intransferível para acesso a conteúdos em vídeo, áudio, textos, materiais de apoio e eventos ao vivo.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">2. Dos Planos, Valores e Pagamentos</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">• Cartão de Crédito (à vista ou parcelado)</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 4px;">• PIX (à vista)</p>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">• Crédito como pagamento recorrente</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">3. Inadimplência e Cancelamento</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Falta de pagamento resulta em bloqueio automático de acesso e remoção da vitrine de terapeutas.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">4. Política de Arrependimento e Reembolso</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Conforme Art. 49 do CDC: cancelamento e reembolso integral em até 7 dias corridos da aprovação da compra.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">5. Propriedade Intelectual</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">Todo conteúdo é propriedade exclusiva do Instituto Behn. Proibido compartilhamento de senhas, download, cópia, revenda ou pirataria.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">6. Vitrine de Terapeutas</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">O Instituto não se responsabiliza por atendimentos clínicos entre cliente e terapeuta. A responsabilidade é exclusivamente do terapeuta.</p>

<h4 style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#1e3a5f;">7. Disposições Gerais</h4>
<p style="font-size:13px;color:#475569;line-height:1.8;margin:0 0 12px;">O Instituto reserva-se o direito de atualizar estes termos a qualquer momento. Foro da comarca da sede da empresa.</p>

<p style="font-size:13px;color:#475569;line-height:1.8;margin:16px 0 0;font-weight:700;">INSTITUTO BEHN DE HIPNOSE E TERAPIA</p>
`

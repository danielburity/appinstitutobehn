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
        const secretKey = Deno.env.get('PAGARME_SECRET_KEY')?.trim()
        if (!secretKey) throw new Error('PAGARME_SECRET_KEY not set')

        let body;
        try {
            body = await req.json()
        } catch (e) {
            throw new Error('Corpo da requisição inválido (JSON esperado)')
        }

        const { plan_id, customer, user_id, redirect_url, is_new_user } = body

        if (!plan_id) {
            throw new Error(`Parâmetro obrigatório ausente: plan_id`)
        }

        // --- NOVA LÓGICA: NOTIFICAÇÃO DE NOVO CADASTRO VIA RESEND ---
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey && is_new_user) {
            console.log(`[NOTIFY] Enviando notificação de novo cadastro para contato@institutobehn.com.br`)
            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendKey}`
                    },
                    body: JSON.stringify({
                        from: 'Instituto Behn <contato@institutobehn.com.br>',
                        to: 'contato@institutobehn.com.br',
                        subject: '🚀 Novo Cadastro no App - Instituto Behn',
                        html: `
                            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                                <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Novo Aluno/Terapeuta Detectado</h2>
                                <p style="font-size: 16px;">Um novo usuário acaba de se cadastrar e foi encaminhado para o pagamento:</p>
                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p><strong>Nome:</strong> ${customer.name}</p>
                                    <p><strong>Email:</strong> ${customer.email}</p>
                                    <p><strong>Documento:</strong> ${customer.document}</p>
                                    <p><strong>WhatsApp:</strong> ${customer.phone?.area_code}${customer.phone?.number}</p>
                                </div>
                                <p style="font-size: 14px; color: #64748b;">O usuário já foi automaticamente registrado como <strong>Terapeuta</strong> e o selo de aprovação foi ativado.</p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-[10px]; text-align: center; color: #94a3b8;">Notificação Automática - App Instituto Behn</p>
                            </div>
                        `
                    })
                })

                const mailResult = await emailResponse.json()
                console.log(`[NOTIFY] Resultado Resend:`, mailResult)
            } catch (notifyErr) {
                console.error(`[NOTIFY] Erro ao enviar e-mail de notificação:`, notifyErr)
            }
        }

        console.log(`[DEBUG] Criando Link de Assinatura V5: Plan: ${plan_id} | User: ${user_id || 'Visitante'}`)

        const cleanCustomer = {
            name: String(customer.name || "Cliente").trim().toUpperCase(),
            email: String(customer.email || "").trim().toLowerCase(),
            document: String(customer.document || "").replace(/\D/g, '').substring(0, 11),
            document_type: 'CPF',
            type: 'individual',
            phones: {
                mobile_phone: {
                    country_code: '55',
                    area_code: String(customer.phone?.area_code || "11").replace(/\D/g, '').substring(0, 2),
                    number: String(customer.phone?.number || "999999999").replace(/\D/g, '').slice(-9)
                }
            }
        }

        // --- PAYLOAD DEFINITIVO: CRIANDO PEDIDO (ORDER) COM CHECKOUT ---
        // A API de Orders suporta nativamente 'success_url' dentro do objeto 'checkout'
        const orderPayload = {
            items: [
                {
                    amount: 100, // R$ 1,00
                    description: "Assinatura Anual Premium",
                    quantity: 1,
                    code: "plan_premium_anual"
                }
            ],
            customer: cleanCustomer,
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 3600,
                        skip_checkout_success_page: true,
                        success_url: redirect_url || "https://instituto-behn.vercel.app",
                        accepted_payment_methods: ["credit_card", "pix"],
                        credit_card: {
                            operation_type: "auth_and_capture",
                            installments: [
                                { number: 1, total: 100 }
                            ]
                        },
                        pix: {
                            expires_in: 3600
                        }
                    }
                }
            ],
            metadata: {
                user_id: user_id,
                customer_email: cleanCustomer.email,
                flow: "v5_order_hosted_checkout"
            }
        }

        console.log(`[DEBUG] Enviando Payload Order V5:`, JSON.stringify(orderPayload))

        const orderResp = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(secretKey + ':')}`
            },
            body: JSON.stringify(orderPayload)
        })

        const responseText = await orderResp.text()
        console.log(`[DEBUG] Resposta Pagar.me [${orderResp.status}]:`, responseText)

        let orderResult;
        try {
            orderResult = responseText ? JSON.parse(responseText) : {}
        } catch (e) {
            throw new Error(`Erro na resposta do Pagar.me: ${responseText.substring(0, 200)}`)
        }

        if (!orderResp.ok) {
            console.error(`[FALHA PAGARME] Detalhes do erro:`, JSON.stringify(orderResult))
            const errorMessage = orderResult.message ||
                (orderResult.errors ? JSON.stringify(orderResult.errors) : `Erro ${orderResp.status}`);
            throw new Error(`Pagar.me retornou erro: ${errorMessage}`)
        }

        // A URL de pagamento no endpoint de Orders fica dentro de checkouts[0].payment_url
        const paymentUrl = orderResult.checkouts?.[0]?.payment_url;
        const orderId = orderResult.id;

        if (!paymentUrl) {
            throw new Error("URL de pagamento não retornada pelo Pagar.me")
        }

        return new Response(JSON.stringify({
            url: paymentUrl,
            id: orderId
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error(`[ERRO] ${err.message}`)
        return new Response(JSON.stringify({
            error: {
                message: err.message
            }
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

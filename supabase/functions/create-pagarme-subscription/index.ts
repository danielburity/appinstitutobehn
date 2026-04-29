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

        const { 
            plan_id, 
            customer, 
            user_id, 
            redirect_url, 
            is_new_user, 
            course_id, 
            course_title, 
            installments,
            payment_type = "order" 
        } = body

        // Number of installments chosen by the user (1 to maxInstallments)
        const chosenInstallments = Math.max(1, parseInt(String(installments || 1)))

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

        // --- LÓGICA DE ASSINATURA RECORRENTE (MODO SUBSCRIPTION) ---
        if (payment_type === "subscription") {
            console.log(`[DEBUG] Criando ASSINATURA RECORRENTE: Plan: ${plan_id} | User: ${user_id}`)
            
            const subscriptionPayload = {
                plan_id: plan_id, 
                payment_method: "checkout",
                customer: cleanCustomer,
                checkout: {
                    expires_in: 3600,
                    success_url: redirect_url || "https://instituto-behn.vercel.app",
                    accepted_payment_methods: ["credit_card"],
                    skip_checkout_success_page: false,
                    customer_editable: false
                },
                metadata: {
                    user_id: user_id,
                    customer_email: cleanCustomer.email,
                    flow: "recurring_subscription"
                }
            }

            const subResp = await fetch('https://api.pagar.me/core/v5/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(secretKey + ':')}`
                },
                body: JSON.stringify(subscriptionPayload)
            })

            const subText = await subResp.text()
            console.log(`[DEBUG] Resposta Sub [${subResp.status}]:`, subText)
            
            const subResult = JSON.parse(subText)
            if (!subResp.ok) throw new Error(`Pagar.me Sub Error: ${subResult.message || subText}`)

            return new Response(JSON.stringify({
                url: subResult.checkouts?.[0]?.payment_url,
                id: subResult.id
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- PAYLOAD DEFINITIVO: CRIANDO PEDIDO (ORDER) COM CHECKOUT ---
        // A API de Orders suporta nativamente 'success_url' dentro do objeto 'checkout'
        
        let orderAmount = 180000; // R$ 1.800,00 — Acesso Plataforma + Afiliados Behn
        let orderDescription = "Acesso à Plataforma Instituto Behn + Curso Afiliados";
        let orderCode = "plan_premium_anual";

        if (course_id) {
            orderDescription = course_title ? `Compra de Curso: ${course_title}` : "Compra de Curso Individual";
            orderCode = `course_${course_id}`;
            orderAmount = 100; // Fallback para R$ 1,00

            // Buscar preço real do banco de dados para segurança
            const supabaseUrl = Deno.env.get('SUPABASE_URL');
            const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
            if (supabaseUrl && supabaseKey) {
                try {
                    const dbResp = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${course_id}&select=price`, {
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`
                        }
                    });
                    const dbData = await dbResp.json();
                    if (dbData && dbData.length > 0 && dbData[0].price > 0) {
                        orderAmount = dbData[0].price;
                        console.log(`[DEBUG] Preço encontrado para o curso ${course_id}: ${orderAmount} centavos`);
                    }
                } catch (e) {
                    console.error("[PRICE FETCH ERROR]", e);
                }
            }
        }
        
        const orderPayload = {
            items: [
                {
                    amount: orderAmount,
                    description: orderDescription,
                    quantity: 1,
                    code: orderCode
                }
            ],
            customer: cleanCustomer,
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 3600,
                        // skip_checkout_success_page removido: para PIX, a tela de sucesso DO Pagar.me
                        // é onde o QR Code é exibido. Removendo isso, o Pagar.me mostra o QR Code
                        // corretamente. O webhook libera o acesso automaticamente após confirmação.
                        success_url: redirect_url || "https://instituto-behn.vercel.app",
                        accepted_payment_methods: ["credit_card", "pix"],
                        credit_card: {
                            operation_type: "auth_and_capture",
                            installments: Array.from({ length: chosenInstallments }, (_, i) => ({
                                number: i + 1,
                                total: orderAmount
                            }))
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
                flow: course_id ? "course_sale" : "v5_order_hosted_checkout",
                course_id: course_id || null
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

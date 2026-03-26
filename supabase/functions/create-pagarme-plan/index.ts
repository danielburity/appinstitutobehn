
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Lidar com CORS (browser pre-flight)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log("--- Nova Requisição Recebida ---")

    try {
        // 2. Tentar ler o segredo dentro do ambiente
        const PAGARME_SECRET_KEY = Deno.env.get('PAGARME_SECRET_KEY')
        if (!PAGARME_SECRET_KEY) {
            console.error("ERRO: PAGARME_SECRET_KEY não encontrada no ambiente.")
            throw new Error('PAGARME_SECRET_KEY is not set')
        }

        // 3. Tentar ler o corpo da requisição com segurança
        let body = {}
        try {
            const text = await req.text()
            if (text) {
                body = JSON.parse(text)
            }
        } catch (e) {
            console.warn("Aviso: Falha ao processar o JSON do corpo. Usando valores padrão.")
        }

        const { name, price_cents } = body as any

        const planName = name || "Plano Anual Premium - Instituto Behn"
        const planPrice = price_cents || 100 // R$ 1,00 para teste real em produção

        console.log(`GERANDO PLANO ANUAL: ${planName} - Valor: ${planPrice} centavos`)

        // 4. Chamada para o Pagar.me (V5)
        const response = await fetch('https://api.pagar.me/core/v5/plans', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(PAGARME_SECRET_KEY + ':')}`
            },
            body: JSON.stringify({
                name: planName,
                interval: "year",
                interval_count: 1,
                payment_methods: ["credit_card"],
                billing_type: "prepaid",
                status: "active",
                installments: [1, 12], // Permite 1x ou 12x
                items: [
                    {
                        name: "Assinatura Anual Premium",
                        quantity: 1,
                        pricing_scheme: {
                            price: planPrice,
                            scheme_type: "unit"
                        }
                    }
                ]
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Erro retornado pelo Pagar.me:', JSON.stringify(data, null, 2))
            return new Response(JSON.stringify({ error: "Erro no Pagar.me", details: data }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log("Sucesso! Plano criado com ID:", data.id)
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Erro fatal na função:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

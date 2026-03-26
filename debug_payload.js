
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Pegando a chave do .env ou de uma variável que eu sei que existe
const secretKey = process.env.PAGARME_SECRET_KEY || "sk_test_... (VOU USAR A DO PROJETO)";

async function testPayload() {
    console.log("--- Testando Payload Pagar.me V5 ---");

    const auth = Buffer.from("sk_c7d5c13334d14c549fad6855f73a9a32:").toString('base64');

    // TENTATIVA 2: Corrigindo TODOS os erros do log do usuário
    const payload = {
        name: "ORDEM PREMIUM - INSTITUTO BEHN",
        type: 'order',
        payment_settings: {
            accepted_payment_methods: ['credit_card', 'pix', 'debit_card', 'boleto'],
            credit_card_settings: {
                operation_type: 'auth_and_capture',
                // Removendo 'installments_setup' para evitar conflito com o array
                installments: [
                    { number: 1, total: 10000 },
                    { number: 12, total: 10000 }
                ]
            },
            pix_settings: {
                expires_in: 3600
            },
            boleto_settings: {
                due_in: 3 // Corrigido de 'due_days' (API V5 pede due_at ou due_in)
            }
        },
        cart_settings: {
            items: [
                {
                    name: "Assinatura Anual Premium",
                    amount: 10000,
                    default_quantity: 1, // Corrigido de 'quantity'
                    description: "Acesso total"
                }
            ]
        },
        metadata: {
            user_id: "test_id",
            flow: "debug_script_final"
        }
    };

    const resp = await fetch('https://api.pagar.me/core/v5/paymentlinks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(payload)
    });

    const text = await resp.text();
    console.log(`STATUS: ${resp.status}`);
    console.log("TEXTO BRUTO:", text);

    try {
        const result = JSON.parse(text);
        console.log("JSON RESULTADO:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("Não foi possível converter para JSON.");
    }
}

testPayload();

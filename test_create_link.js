
import https from 'https';
import { Buffer } from 'buffer';

// DADOS DE TESTE
const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const planId = "plan_ywqbQZOtRsrqKlpo";
const auth = Buffer.from(secretKey + ':').toString('base64');

// Payload idêntico ao da Edge Function
const payload = {
    name: "TESTE SCRIPT NODE - ASSINATURA",
    type: 'subscription',
    payment_settings: {
        accepted_payment_methods: ['credit_card'],
        credit_card_settings: {
            operation_type: 'auth_and_capture'
        }
    },
    subscription: {
        plan_id: planId,
        payment_method: 'credit_card',
        customer: {
            name: "CLIENTE TESTE SCRIPT",
            email: "teste.script.node@example.com",
            document: "52656462262", // CPF válido gerado
            document_type: 'CPF',
            type: 'individual',
            phones: {
                mobile_phone: {
                    country_code: '55',
                    area_code: '11',
                    number: '999999999'
                }
            },
            address: {
                line_1: "1000, Avenida Paulista, Bela Vista",
                zip_code: "01310100",
                city: "Sao Paulo",
                state: "SP",
                country: "BR"
            }
        }
    },
    // CORREÇÃO: Adicionando Items e Cart Settings exigidos pelo endpoint de PaymentLink
    items: [
        {
            id: planId,
            description: "Assinatura Anual Premium",
            quantity: 1,
            amount: 10000, // 100.00 (Valor de display, o real vem do plano)
            status: "active"
        }
    ],
    cart_settings: {
        side_cart_enabled: false,
        recurrences: [
            {
                plan_id: planId
            }
        ]
    },
    metadata: {
        flow: "test_script_node"
    }
};

console.log("--- Teste Criação de Link (Node.js) ---");
console.log("Enviando Payload:", JSON.stringify(payload, null, 2));

const options = {
    hostname: 'api.pagar.me',
    port: 443,
    path: '/core/v5/paymentlinks',
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('RESULTADO BODY:', data);
        try {
            const json = JSON.parse(data);
            if (json.errors) {
                console.error("❌ ERROS DETALHADOS:", JSON.stringify(json.errors, null, 2));
            }
        } catch (e) { }
    });
});

req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();

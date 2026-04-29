import { createClient } from '@supabase/supabase-js';
import https from 'https';

const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const auth = Buffer.from(secretKey + ':').toString('base64');

const payload = {
    type: "subscription",
    name: "Assinatura Mensal",
    customer: {
        name: "DANIEL GARCIA BURITY",
        email: "daniel.burity@gmail.com",
        document: "30558265820",
        document_type: 'CPF',
        type: 'individual',
        phones: { mobile_phone: { country_code: '55', area_code: "11", number: "972096792" } }
    },
    payment_settings: {
        accepted_payment_methods: ["credit_card"],
        credit_card_settings: {
            operation_type: "auth_and_capture"
        }
    },
    cart_settings: {
        recurrences: [
            {
                interval: "month",
                interval_count: 1,
                pricing_scheme: {
                    scheme_type: "unit",
                    price: 15000
                },
                plan_id: "plan_klRjQdRTOfxg43Wp"
            }
        ]
    },
    metadata: {
        user_id: "test",
        flow: "recurring_subscription"
    }
};

const options = {
    hostname: 'api.pagar.me',
    port: 443,
    path: `/core/v5/paymentlinks`,
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', data);
    });
});
req.write(JSON.stringify(payload));
req.end();

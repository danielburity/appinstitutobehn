import { createClient } from '@supabase/supabase-js';
import https from 'https';

const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const auth = Buffer.from(secretKey + ':').toString('base64');

const orderPayload = {
    customer: {
        name: "DANIEL GARCIA BURITY",
        email: "daniel.burity@gmail.com",
        document: "30558265820",
        document_type: 'CPF',
        type: 'individual',
        phones: { mobile_phone: { country_code: '55', area_code: "11", number: "972096792" } }
    },
    items: [
        {
            quantity: 1,
            plan_id: "plan_klRjQdRTOfxg43Wp"
        }
    ],
    payments: [
        {
            payment_method: "checkout",
            checkout: {
                expires_in: 3600,
                accepted_payment_methods: ["credit_card"],
                success_url: "https://instituto-behn.vercel.app/home",
            }
        }
    ]
};

const options = {
    hostname: 'api.pagar.me',
    port: 443,
    path: `/core/v5/orders`,
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const req = https.request(options, (res) => {
    let data = ''; res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('RESPONSE:', data); });
});
req.write(JSON.stringify(orderPayload)); req.end();

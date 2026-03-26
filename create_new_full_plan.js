
import https from 'https';
import { Buffer } from 'buffer';

const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const auth = Buffer.from(secretKey + ':').toString('base64');

const payload = {
    name: "Plano Premium Completo (CC, Pix, Boleto)",
    interval: "year",
    interval_count: 1,
    billing_type: "prepaid",
    payment_methods: ["credit_card", "boleto", "debit_card"],
    items: [
        {
            name: "Assinatura Anual Instituto Behn",
            quantity: 1,
            pricing_scheme: {
                scheme_type: "unit",
                price: 100 // R$ 1,00 para teste
            }
        }
    ]
};

console.log("--- Criando Novo Plano Pagar.me (Todos os Meios) ---");

const options = {
    hostname: 'api.pagar.me',
    port: 443,
    path: '/core/v5/plans',
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log('RESULTADO:', data);
        try {
            const json = JSON.parse(data);
            if (json.id) {
                console.log(`\n✅ NOVO PLANO CRIADO COM SUCESSO!`);
                console.log(`ID DO PLANO: ${json.id}`);
                console.log(`Copie este ID para usar na Edge Function.`);
            }
        } catch (e) { }
    });
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify(payload));
req.end();

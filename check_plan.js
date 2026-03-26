
import https from 'https';
import { Buffer } from 'buffer';

const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const planId = "plan_ywqbQZOtRsrqKlpo";

console.log("--- Pagar.me Plan Checker (Node.js ESM) ---");
console.log(`Verificando Plano: ${planId}`);
console.log(`Usando Key: ${secretKey.substring(0, 6)}...`);

const auth = Buffer.from(secretKey + ':').toString('base64');

const options = {
    hostname: 'api.pagar.me',
    port: 443,
    path: `/core/v5/plans/${planId}`,
    method: 'GET',
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
        console.log('BODY:', data);
        if (res.statusCode === 200) {
            console.log("✅ SUCESSO! O plano existe e a chave é válida.");
        } else {
            console.log("❌ ERRO! Verifique a mensagem acima.");
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();

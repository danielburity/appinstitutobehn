
import https from 'https';

const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
const planId = "plan_EjV06G7fx6HXmzx6";

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
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('PLAN DETAILS:', data);
    });
});

req.on('error', (e) => { console.error(e); });
req.end();

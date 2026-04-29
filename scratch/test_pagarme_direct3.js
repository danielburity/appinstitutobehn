import { createClient } from '@supabase/supabase-js';
import https from 'https';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSub() {
    console.log("Getting plan ID...");
    const { data: settingsData } = await supabase.from('app_settings').select('*');
    const monthlyPlanId = settingsData.find(i => i.key === 'subscriptionMonthlyPlanId')?.value;
    console.log("Plan ID:", monthlyPlanId);

    const subscriptionPayload = {
        plan_id: monthlyPlanId, 
        payment_method: "checkout",
        customer: {
            name: "DANIEL GARCIA BURITY",
            email: "daniel.burity@gmail.com",
            document: "30558265820",
            document_type: 'CPF',
            type: 'individual',
            phones: {
                mobile_phone: {
                    country_code: '55',
                    area_code: "11",
                    number: "972096792"
                }
            }
        },
        checkout: {
            expires_in: 3600,
            billing_address_editable: true,
            customer_editable: false,
            accepted_payment_methods: ["credit_card"],
            success_url: "https://instituto-behn.vercel.app/home",
            skip_checkout_success_page: false
        },
        metadata: {
            user_id: "test",
            customer_email: "daniel.burity@gmail.com",
            flow: "recurring_subscription"
        }
    };

    const secretKey = "sk_c7d5c13334d14c549fad6855f73a9a32";
    const auth = Buffer.from(secretKey + ':').toString('base64');

    console.log("Calling Pagar.me directly...");
    const options = {
        hostname: 'api.pagar.me',
        port: 443,
        path: `/core/v5/subscriptions`,
        method: 'POST',
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
            console.log('STATUS:', res.statusCode);
            console.log('RESPONSE:', data);
        });
    });

    req.on('error', (e) => { console.error(e); });
    req.write(JSON.stringify(subscriptionPayload));
    req.end();
}

testSub();

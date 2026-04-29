import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSub() {
    console.log("Getting plan ID...");
    const { data: settingsData } = await supabase.from('app_settings').select('*');
    const monthlyPlanId = settingsData.find(i => i.key === 'subscriptionMonthlyPlanId')?.value;
    console.log("Plan ID:", monthlyPlanId);

    console.log("Invoking Edge Function...");
    const res = await fetch(`${supabaseUrl}/functions/v1/create-pagarme-subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            user_id: `test_existing_${Date.now()}`,
            plan_id: monthlyPlanId,
            payment_type: "subscription",
            course_id: null,
            course_title: null,
            installments: 1,
            redirect_url: "https://instituto-behn.vercel.app/home",
            is_new_user: false,
            customer: {
                name: "DANIEL GARCIA BURITY",
                email: "daniel.burity@gmail.com",
                document: "30558265820",
                phone: { area_code: "11", number: "972096792" }
            }
        })
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
}

testSub();

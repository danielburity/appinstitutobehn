
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Settings:', data);
    
    const monthlyPlanId = data.find(i => i.key === 'subscriptionMonthlyPlanId')?.value;
    console.log('Current Monthly Plan ID:', monthlyPlanId);
}

debug();

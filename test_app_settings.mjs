import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking app_settings rows...");
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) {
    console.error("Select error:", error);
  } else {
    console.log(`Rows found: ${data.length}`, data);
  }

  console.log("Trying to upsert a test value...");
  const { data: upsertData, error: upsertError } = await supabase
    .from('app_settings')
    .upsert({ key: "test_key", value: "test_value" }, { onConflict: 'key' })
    .select();

  if (upsertError) {
    console.error("Upsert Error:", upsertError);
  } else {
    console.log("Upsert Success, returned data:", upsertData);
  }
}
main();

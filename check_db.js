import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking app_settings table:");
  const res1 = await supabase.from('app_settings').select('*').limit(1);
  if (res1.error) console.log(`app_settings Error: ${res1.error.message}`);
  else console.log("app_settings Exists!");

  console.log("\nChecking courses table (slug column):");
  const res2 = await supabase.from('courses').select('slug').limit(1);
  if (res2.error) console.log(`courses.slug Error: ${res2.error.message}`);
  else console.log("courses.slug Exists!");
}
main();

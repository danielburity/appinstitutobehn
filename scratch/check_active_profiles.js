import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, subscription_status')
    .or('subscription_status.eq.active,role.eq.admin');
    
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}

checkProfiles();

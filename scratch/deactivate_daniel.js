import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deactivateOldDaniel() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'inactive' })
    .eq('email', 'daniel.garcia@grupoideale.com.br');
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Successfully deactivated old Daniel.");
  }
}

deactivateOldDaniel();

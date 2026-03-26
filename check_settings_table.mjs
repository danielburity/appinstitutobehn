
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettingsTable() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);

    if (error) {
        console.log("Table 'site_settings' does not exist or error:", error.message);
    } else {
        console.log("Table 'site_settings' exists. Columns:", data.length > 0 ? Object.keys(data[0]) : "Empty");
    }
}

checkSettingsTable();

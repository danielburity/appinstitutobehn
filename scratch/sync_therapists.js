import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncUser(email) {
  console.log(`\nSyncing user: ${email}`);
  
  // 1. Find the user in profiles
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
    
  if (profileErr || !profile) {
    console.error(`Profile not found for ${email}:`, profileErr?.message);
    return;
  }
  
  console.log(`Found profile: ID=${profile.id}, Name=${profile.full_name}, Avatar=${profile.avatar_url}`);
  
  // 2. Check if a therapist record exists matching this name
  let { data: therapistByName } = await supabase
    .from('therapists')
    .select('*')
    .ilike('name', profile.full_name)
    .maybeSingle();
    
  if (!therapistByName) {
     console.log(`No therapist found with name ${profile.full_name}. Creating new therapist record...`);
     const { error: insertErr } = await supabase.from('therapists').insert({
       name: profile.full_name,
       avatar_url: profile.avatar_url,
       state: 'Em Configuração',
       specialties: ['Terapeuta']
     });
     if (insertErr) console.error("Error creating therapist:", insertErr.message);
     else console.log("Created therapist successfully!");
     return;
  }
  
  console.log(`Found therapist: ID=${therapistByName.id}, Name=${therapistByName.name}, Avatar=${therapistByName.avatar_url}`);
  
  // 3. Sync the avatar_url
  if (profile.avatar_url && therapistByName.avatar_url !== profile.avatar_url) {
     console.log(`Updating avatar_url to: ${profile.avatar_url}`);
     const { error: updateErr } = await supabase
       .from('therapists')
       .update({ avatar_url: profile.avatar_url })
       .eq('id', therapistByName.id);
       
     if (updateErr) console.error("Error updating therapist:", updateErr.message);
     else console.log("Successfully updated therapist record.");
  } else {
     console.log("Therapist record is already perfectly synced.");
  }
}

async function run() {
  await syncUser('emersoneliezerterapeuta@gmail.com');
  await syncUser('daniel.burity@gmail.com');
}

run();

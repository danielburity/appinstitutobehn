import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixPrices() {
  // Fix TRAINER HNV: 1500 → 1500000 (R$ 15.000,00)
  const { error: e1 } = await supabase
    .from('courses')
    .update({ price: 1500000 })
    .eq('slug', 'trainer-hnv');
  
  if (e1) console.error('Erro TRAINER:', e1);
  else console.log('✅ TRAINER HNV: preço atualizado para R$ 15.000,00 (1500000 centavos)');

  // Fix Afiliação: 180 → 180000 (R$ 1.800,00)
  const { error: e2 } = await supabase
    .from('courses')
    .update({ price: 180000 })
    .eq('slug', 'afiliacao-instituto-behn');
  
  if (e2) console.error('Erro Afiliação:', e2);
  else console.log('✅ Afiliação Instituto Behn: preço atualizado para R$ 1.800,00 (180000 centavos)');

  // Verify
  const { data } = await supabase
    .from('courses')
    .select('title, slug, price')
    .in('slug', ['trainer-hnv', 'afiliacao-instituto-behn']);
  
  console.log('\nVerificação:');
  data?.forEach(c => {
    console.log(`  ${c.title}: R$ ${(c.price / 100).toFixed(2).replace('.', ',')}`);
  });
}

fixPrices();

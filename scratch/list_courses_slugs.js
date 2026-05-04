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

async function listCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, is_premium, price, published')
    .order('title', { ascending: true });

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('\n=== CURSOS COM URL DE COMPRA ===\n');
  data.forEach(c => {
    const priceStr = c.price ? `R$ ${(c.price / 100).toFixed(2).replace('.', ',')}` : 'Sem preço';
    const status = c.published ? '✅' : '❌';
    const premium = c.is_premium ? '🔒 Premium' : '🆓 Gratuito';
    const url = c.slug ? `https://app.institutobehn.com.br/comprar/${c.slug}` : '⚠️ SEM SLUG';
    
    console.log(`${status} ${c.title}`);
    console.log(`   ${premium} | ${priceStr} | ID: ${c.id}`);
    console.log(`   🔗 ${url}`);
    console.log('');
  });
}

listCourses();

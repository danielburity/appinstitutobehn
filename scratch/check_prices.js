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

async function checkAll() {
  // ALL courses including unpublished
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, is_premium, price, published')
    .order('id', { ascending: true });

  if (error) { console.error('Erro:', error); return; }

  console.log('\n=== TODOS OS CURSOS (incluindo não publicados) ===\n');
  data.forEach(c => {
    const priceReais = c.price ? (c.price / 100).toFixed(2) : '0.00';
    const published = c.published ? '✅' : '❌';
    console.log(`${published} ID:${c.id} | ${c.title} | slug: ${c.slug} | premium: ${c.is_premium} | price (centavos): ${c.price} | price (reais): R$ ${priceReais}`);
  });

  console.log('\n=== CURSOS COM SLUG CONTENDO "afiliado" ===');
  const afiliados = data.filter(c => c.slug && c.slug.includes('afiliado'));
  if (afiliados.length === 0) {
    console.log('Nenhum encontrado!');
    const afiliacoes = data.filter(c => c.slug && (c.slug.includes('afilia') || c.title.toLowerCase().includes('afilia')));
    console.log('Buscando "afilia":', afiliacoes.map(c => `${c.slug} (${c.title})`));
  } else {
    afiliados.forEach(c => console.log(`  ${c.slug} → ${c.title}`));
  }

  console.log('\n=== PREÇOS QUE PARECEM ERRADOS ===');
  data.forEach(c => {
    const reais = c.price / 100;
    // TRAINER should be R$15.000
    if (c.slug === 'trainer-hnv' && reais !== 15000) {
      console.log(`⚠️ ${c.title}: R$ ${reais.toFixed(2)} → deveria ser R$ 15.000,00 (1500000 centavos)`);
    }
    // Afiliação should be R$1.800
    if (c.slug && c.slug.includes('afilia') && reais < 100) {
      console.log(`⚠️ ${c.title}: R$ ${reais.toFixed(2)} → deveria ser R$ 1.800,00 (180000 centavos)?`);
    }
  });
}

checkAll();

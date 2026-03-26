
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log("--- DB Subscription & Webhook Check ---");

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: Variáveis de ambiente faltando.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Consultando Perfis...");
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (pError) {
        console.error("Erro ao buscar perfis:", pError.message);
    } else {
        console.log("Últimos perfis atualizados:");
        profiles.forEach(p => {
            console.log(`Email: ${p.email} | ID: ${p.id} | Status: ${p.subscription_status} | Atualizado: ${p.updated_at}`);
        });
    }

    console.log("\n--- Debug de Webhooks ---");
    const { data: webhooks, error: webError } = await supabase
        .from('webhook_debug')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (webError) {
        console.error("Erro ao buscar logs de webhook:", webError.message);
    } else if (!webhooks || webhooks.length === 0) {
        console.log("Nenhum webhook recebido ainda na tabela de debug.");
    } else {
        webhooks.forEach(w => {
            console.log(`[${w.created_at}] Evento: ${w.event_type} | ID: ${w.payload?.id || 'N/A'}`);
            const userId = w.payload?.data?.metadata?.user_id || w.payload?.metadata?.user_id;
            console.log(`   User ID no Payload: ${userId || 'Não encontrado'}`);
        });
    }
}

check().catch(console.error);

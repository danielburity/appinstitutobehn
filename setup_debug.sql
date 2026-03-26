
-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS public.webhook_debug (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    event_type text,
    payload jsonb
);

-- Ativar RLS
ALTER TABLE public.webhook_debug ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem (para evitar erros de duplicata)
DROP POLICY IF EXISTS "Enable insert for all" ON public.webhook_debug;
DROP POLICY IF EXISTS "Enable read for all" ON public.webhook_debug;

-- Políticas
CREATE POLICY "Enable insert for all" ON public.webhook_debug FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for all" ON public.webhook_debug FOR SELECT USING (true);

-- Notificar cache (opcional, mas ajuda)
NOTIFY pgrst, 'reload schema';

-- Execute este script no SQL Editor do Supabase para adicionar o campo de CEP
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.therapists.postal_code IS 'CEP do terapeuta para busca regional';

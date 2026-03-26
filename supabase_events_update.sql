-- Adicionar coluna external_url na tabela de eventos
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Garantir que image_url existe (caso não esteja lá)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Garantir que avatar_url em terapeutas aceite URLs longas
-- ALTER TABLE therapists ALTER COLUMN avatar_url TYPE TEXT;

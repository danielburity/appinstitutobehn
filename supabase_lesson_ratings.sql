-- Tabela para avaliações das aulas
CREATE TABLE IF NOT EXISTS lesson_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Habilitar RLS
ALTER TABLE lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view all ratings" ON lesson_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own rating" ON lesson_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating" ON lesson_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rating" ON lesson_ratings
  FOR DELETE USING (auth.uid() = user_id);

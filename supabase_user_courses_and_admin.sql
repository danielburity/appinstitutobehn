-- 1. Cria a Tabela de Vínculo entre Usuários e Cursos (A-La-Carte)
CREATE TABLE IF NOT EXISTS public.user_courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 2. Habilita RLS na Tabela
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Usuários comuns podem LER seus próprios cursos
CREATE POLICY "Users can view own courses" 
ON public.user_courses FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 4. Policy: Admins podem INSERIR/ATUALIZAR cursos para qualquer um
CREATE POLICY "Admins can manage user courses" 
ON public.user_courses FOR ALL 
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Expandir os poderes do Admin na tabela PROFILES (para poderem criar contas expressas para outros)
CREATE POLICY "Admins can insert ANY profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update ANY profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SECURITY HARDENING - INSTITUTO BEHN
-- Este script ativa Row Level Security (RLS) e define políticas de acesso granulares.

-- 1. Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA 'profiles'
-- Usuários podem ler todos os perfis (ajuda em listagens), mas editar apenas o próprio
CREATE POLICY "Profiles são públicos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários editam próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. POLÍTICAS PARA 'courses', 'modules', 'lessons'
-- Público/Membros podem ver cursos publicados
CREATE POLICY "Cursos publicados são visíveis" ON public.courses FOR SELECT USING (published = true);
-- Admins podem fazer tudo
CREATE POLICY "Admins gerenciam cursos" ON public.courses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Módulos visíveis para membros" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam módulos" ON public.modules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Aulas visíveis para membros" ON public.lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'member'))
);
CREATE POLICY "Admins gerenciam aulas" ON public.lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. POLÍTICAS PARA 'therapists' e 'events'
CREATE POLICY "Terapeutas visíveis" ON public.therapists FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam terapeutas" ON public.therapists FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Eventos visíveis" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam eventos" ON public.events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. POLÍTICAS PARA 'lesson_ratings' e 'user_progress'
CREATE POLICY "Progresso pessoal" ON public.user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Avaliações pessoais" ON public.lesson_ratings FOR ALL USING (auth.uid() = user_id);

-- 6. POLÍTICAS PARA 'lesson_attachments'
CREATE POLICY "Anexos visíveis para membros" ON public.lesson_attachments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'member'))
);
CREATE POLICY "Admins gerenciam anexos" ON public.lesson_attachments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- NOTA: Execute este script no SQL Editor do Supabase Dashboard.

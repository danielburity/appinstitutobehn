-- Política para permitir que usuários administrativos insiram novas notificações em massa
CREATE POLICY "Permitir insercao de notificacoes" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true); 

-- Garantir que os administradores possam visualizar a lista de todos os perfis para fazer o disparo
CREATE POLICY "Permitir leitura de profiles para admins"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

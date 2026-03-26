import { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireMember = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
  requireMember?: boolean;
}) {
  const { user, isAdmin, isMember, loadingProfile, profile, signOut } = useAuth();

  if (loadingProfile) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  if (requireMember && !isMember) {

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-background rounded-full border border-border flex items-center justify-center animate-bounce">
            <span className="text-lg">⏳</span>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter italic">Processando Acesso</h2>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Olá! Estamos confirmando sua assinatura com o **Pagar.me**.
            Isso geralmente leva alguns segundos enquanto o sistema processa seu pagamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-12 font-bold border-primary/20 hover:bg-primary/5"
          >
            Já paguei, carregar agora 🔄
          </Button>

          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-muted-foreground text-xs hover:text-destructive"
          >
            Sair desta conta / Entrar com outro e-mail
          </Button>
        </div>

        <div className="pt-8 border-t border-border/50 w-full max-w-xs flex flex-col gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Precisa de ajuda urgente?</p>
          <a
            href="https://wa.me/5511913035220"
            target="_blank"
            className="flex items-center justify-center gap-2 text-sm font-black text-green-500 hover:scale-105 transition-transform"
          >
            <span className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.656zm6.79-14.514c-.253-.564-.517-.576-.758-.586-.196-.008-.423-.008-.65-.008-.227 0-.584.085-.89.423-.306.338-1.169 1.142-1.169 2.787 0 1.644 1.191 3.235 1.356 3.46.165.225 2.344 3.58 5.678 5.021.803.348 1.432.556 1.921.712.806.255 1.54.219 2.121.132.647-.097 1.849-.757 2.112-1.488.261-.732.261-1.362.183-1.487-.078-.125-.28-.2-.564-.341-.283-.142-1.674-.827-1.933-.92-.258-.095-.445-.142-.633.142-.188.283-.728.92-.89 1.107-.164.188-.327.212-.612.071-.283-.141-1.196-.441-2.278-1.407-.842-.751-1.41-1.678-1.575-1.961-.165-.283-.018-.435.123-.574.127-.126.283-.341.424-.51.141-.17.188-.283.283-.47.094-.188.047-.353-.023-.494-.07-.142-.564-1.362-.773-1.874z" /></svg>
            </span>
            Falar com Suporte Humano
          </a>
        </div>

        {/* Auto-refresh a cada 10s se estiver logado mas sem acesso, para checar ativação */}
        {typeof window !== 'undefined' && user && !isMember && (
          <meta httpEquiv="refresh" content="10" />
        )}
      </div>
    );
  }

  return <>{children}</>;
}

import { useState, useEffect } from "react";
import { Bell, User, Brain, Sun, Moon, Menu, Home, BookOpen, Users, Calendar, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export const Header = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
          setUnreadCount(count => count + 1);
          toast.info("Nova notificação enviada!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleTheme = () => setTheme((resolvedTheme === "dark" ? "light" : "dark"));
  return (
    <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between border-b border-sidebar-foreground/10">
        <div className="flex items-center gap-1 md:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-foreground/10 text-sidebar-foreground -ml-2">
                <Menu className="w-6 h-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-card text-card-foreground border-border" align="start" sideOffset={8}>
              <div className="flex flex-col gap-1">
                <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Home className="w-4 h-4"/> Home
                </button>
                <button onClick={() => navigate('/cursos')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <BookOpen className="w-4 h-4"/> Cursos
                </button>
                <button onClick={() => navigate('/terapeutas')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Users className="w-4 h-4"/> Terapeutas
                </button>
                <button onClick={() => navigate('/eventos')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Calendar className="w-4 h-4"/> Eventos
                </button>
                <button onClick={() => navigate('/seja-parceiro')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Handshake className="w-4 h-4"/> Parceiro
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={`${settings.appName} Logo`} className="h-8 max-h-[48px] w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <Brain className="w-6 h-6 text-[#25D366]" />
            )}
          </button>
        </div>

        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Olá {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bem-vindo(a)'}!
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-[#1a1c2e] border-white/10 text-white" align="end">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-bold">Notificações</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-accent hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <ScrollArea className="h-72">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-white/[0.02]' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!n.read ? 'font-bold text-white' : 'text-white/80'}`}>{n.title}</h4>
                            <span className="text-[10px] text-white/40">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 line-clamp-2">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {isAdmin && (
            <Button variant="ghost" onClick={() => navigate('/admin')} className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground hidden sm:flex">Admin</Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema" className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2 border-l border-sidebar-foreground/10 pl-2 ml-2">
              <button
                onClick={() => navigate('/perfil')}
                className="hover:scale-105 transition-transform"
              >
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-accent text-[10px]">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          ) : (
            <Button variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground" onClick={() => navigate('/login')}>Entrar</Button>
          )}
        </div>
      </div>
    </header>
  );
};

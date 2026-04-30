import React, { useState, useEffect } from "react";
import { Bell, User, Brain, Sun, Moon, Menu, Home, BookOpen, Users, Calendar, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
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
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
          setUnreadCount(count => count + 1);
          toast.info("Nova notificação recebida!");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const handleNotificationClick = async (e: React.MouseEvent, notification: Notification) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle expand / collapse
    setExpandedId(prev => prev === notification.id ? null : notification.id);

    // Mark as read if needed
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between border-b border-sidebar-foreground/10">

        {/* Mobile: hamburger + logo */}
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
                  <Home className="w-4 h-4" /> Home
                </button>
                <button onClick={() => navigate('/cursos')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <BookOpen className="w-4 h-4" /> Cursos
                </button>
                <button onClick={() => navigate('/terapeutas')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Users className="w-4 h-4" /> Terapeutas
                </button>
                <button onClick={() => navigate('/eventos')} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Eventos
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={`${settings.appName} Logo`} className="h-12 max-h-[72px] w-auto max-w-[200px] object-contain object-left" />
            ) : (
              <Brain className="w-6 h-6 text-[#25D366]" />
            )}
          </button>
        </div>

        {/* Desktop: greeting */}
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Olá {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bem-vindo(a)'}!
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* ── Notification Bell ── */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-[#1a1c2e] border-white/10 text-white" align="end">

                {/* Panel header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                      Ler todas
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-white/30">
                      <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Sem notificações</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5">
                      {notifications.map((n) => {
                        const isExpanded = expandedId === n.id;
                        return (
                          <div key={n.id}>
                            {/* Row — click to expand/collapse */}
                            <button
                              type="button"
                              onClick={(e) => handleNotificationClick(e, n)}
                              className={`w-full text-left px-4 py-3 transition-colors duration-150
                                hover:bg-white/[0.05]
                                ${isExpanded ? 'bg-white/[0.06]' : ''}
                                ${!n.read && !isExpanded ? 'bg-blue-500/5' : ''}
                              `}
                            >
                              <div className="flex items-start gap-2.5">
                                {/* Unread dot */}
                                <span className={`mt-[5px] flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-blue-400' : 'bg-transparent'}`} />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className={`text-sm leading-snug truncate ${!n.read ? 'font-bold text-white' : 'font-medium text-white/75'}`}>
                                      {n.title}
                                    </p>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                      <span className="text-[10px] text-white/35 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                      </span>
                                      {isExpanded
                                        ? <ChevronUp className="w-3 h-3 text-white/40" />
                                        : <ChevronDown className="w-3 h-3 text-white/40" />
                                      }
                                    </div>
                                  </div>
                                  {/* One-line preview when collapsed */}
                                  {!isExpanded && (
                                    <p className="text-xs text-white/40 mt-0.5 truncate">{n.content}</p>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Expanded content panel */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 bg-white/[0.04]">
                                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                                  {n.content}
                                </p>
                                {n.link && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); navigate(n.link!); }}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Ver mais
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {isAdmin && (
            <Button variant="ghost" onClick={() => navigate('/admin')} className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground hidden sm:flex">
              Admin
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema" className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2 border-l border-sidebar-foreground/10 pl-2 ml-2">
              <button onClick={() => navigate('/perfil')} className="hover:scale-105 transition-transform">
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-accent text-[10px]">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          ) : (
            <Button variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

import { Home, BookOpen, Users, Calendar, Handshake, Brain, LogOut, MessageCircle, Package, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { settings } = useSettings();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Cursos", path: "/cursos" },
    { icon: Users, label: "Terapeutas", path: "/terapeutas" },
    { icon: Calendar, label: "Eventos", path: "/eventos" },
    { icon: User, label: "Meu Perfil", path: "/perfil" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-foreground/10">
      <div className="h-20 px-6 flex items-center border-b border-sidebar-foreground/10 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full"
        >
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={`${settings.appName} Logo`} className="h-auto w-full max-w-[180px] object-contain" />
          ) : (
            <div className="flex items-center gap-2">
               <Brain className="w-6 h-6 text-[#25D366]" />
               <span className="font-bold text-lg leading-tight tracking-tight">{settings.appName}</span>
            </div>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 scrollbar-thin scrollbar-thumb-white/10">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${isActive
                  ? "bg-sidebar-foreground/10 text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-foreground/10 space-y-4 flex-shrink-0">
        <div className="bg-sidebar-foreground/5 rounded-xl p-4 border border-sidebar-foreground/5 space-y-3">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <span className="text-sm font-bold">Precisa de ajuda?</span>
          </div>
          <a
            href="https://wa.me/5511913035220"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#25D366] text-white text-xs font-extrabold hover:bg-[#20ba59] transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)] active:scale-95"
          >
            WhatsApp Suporte
          </a>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
            toast.success('Até logo!');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground transition-smooth text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};

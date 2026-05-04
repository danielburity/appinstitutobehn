import { Home, BookOpen, Users, Calendar, Handshake, Package, User, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMember, hasCourses } = useAuth();

  const allNavItems = [
    { icon: Home, label: "Home", path: "/home", requireMember: true },
    { icon: BookOpen, label: isMember ? "Cursos" : "Meus Cursos", path: "/cursos", requireMember: false },
    { icon: Users, label: "Terapeutas", path: "/terapeutas", requireMember: true },
    { icon: Calendar, label: "Eventos", path: "/eventos", requireMember: true },
    { icon: User, label: "Perfil", path: "/perfil", requireMember: false },
  ];

  // Para compradores de curso, adiciona botão de upgrade
  const navItems = allNavItems.filter(item => !item.requireMember || isMember);
  if (hasCourses && !isMember) {
    navItems.push({ icon: Sparkles, label: "Upgrade", path: "/assinatura", requireMember: false });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isUpgrade = item.path === "/assinatura";

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 transition-smooth ${
                isUpgrade
                  ? "text-primary"
                  : isActive
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className={`w-5 h-5 ${isUpgrade ? "animate-pulse" : ""}`} />
              <span className={`text-xs font-medium ${isUpgrade ? "font-bold" : ""}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


import { Home, BookOpen, Users, Calendar, Handshake, Package } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Cursos", path: "/cursos" },
    { icon: Users, label: "Terapeutas", path: "/terapeutas" },
    { icon: Calendar, label: "Eventos", path: "/eventos" },
    { icon: Handshake, label: "Parceiro", path: "/seja-parceiro" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 transition-smooth ${isActive
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

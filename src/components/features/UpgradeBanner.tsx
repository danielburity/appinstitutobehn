import { Sparkles, Users, Calendar, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

interface UpgradeBannerProps {
  variant?: "full" | "compact";
}

export const UpgradeBanner = ({ variant = "full" }: UpgradeBannerProps) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isMember, hasCourses } = useAuth();

  // Só mostra para quem tem cursos mas NÃO é assinante da plataforma
  if (isMember || !hasCourses) return null;

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-4 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">Upgrade</span>
        </div>
        <p className="text-sm font-bold text-foreground leading-snug">
          Desbloqueie a plataforma completa!
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Acesso a Terapeutas, Eventos, Curso Afiliados e muito mais.
        </p>
        <Button
          size="sm"
          className="w-full gradient-primary text-white font-bold text-xs"
          onClick={() => navigate('/assinatura')}
        >
          Assinar {settings.subscriptionPrice}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-accent-blue/10 rounded-2xl p-6 md:p-8 border border-primary/20 shadow-lg">
      {/* Glow decoration */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-accent-blue/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
              Upgrade Disponível
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-foreground leading-tight">
            Desbloqueie a Plataforma Completa!
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: Users, text: "Busca de Terapeutas" },
              { icon: Calendar, text: "Agenda de Eventos" },
              { icon: Award, text: "Curso Afiliados Behn" },
              { icon: Sparkles, text: "Comunidade Exclusiva" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
          <div className="text-center">
            <span className="text-3xl font-black text-foreground">{settings.subscriptionPrice}</span>
            <p className="text-xs text-muted-foreground font-medium">{settings.subscriptionInstallments}</p>
          </div>
          <Button
            className="w-full md:w-auto gradient-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all px-8 h-12"
            onClick={() => navigate('/assinatura')}
          >
            Assinar Agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

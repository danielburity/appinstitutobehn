import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Check, Sparkles, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutForm } from "@/components/subscription/CheckoutForm";
import { useSettings } from "@/context/SettingsContext";

/**
 * Página privada de assinatura recorrente mensal (R$150/mês).
 * NÃO aparece em nenhum menu ou navegação.
 * Acessível apenas via link direto: /assinar/recorrente
 *
 * Ao finalizar, ativa o acesso completo à plataforma
 * (mesma lógica da assinatura normal, mas forçando o modo mensal).
 */
export default function RecurringCheckoutPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings();

  const benefits = [
    "Acesso completo à plataforma Instituto Behn",
    "Curso Afiliados Behn",
    "Vitrine de Terapeutas",
    "Eventos exclusivos ao vivo",
    "Materiais de apoio e conteúdos",
    "Suporte via WhatsApp",
  ];

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Bar */}
        <div className="bg-card border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-bold text-lg">{settings.appName}</span>
              )}
            </button>
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Já tenho conta
            </Button>
          </div>
        </div>

        <div className="container max-w-4xl py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assinatura Mensal Recorrente</h2>
              <p className="text-muted-foreground">R$ 150,00/mês • Sem compromisso anual</p>
            </div>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              ← Voltar
            </Button>
          </div>
          {/* 
            CheckoutForm detects paymentMethod via internal state.
            We force monthly mode by passing forceMonthly via URL params.
          */}
          <RecurringCheckoutFormWrapper />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-card border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-bold text-lg">{settings.appName}</span>
            )}
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
            Já tenho conta
          </Button>
        </div>
      </div>

      <div className="container py-16 px-4">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 mb-4">
            <Lock className="w-3.5 h-3.5 mr-1.5 inline-block" />
            Convite Exclusivo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Plano <span className="text-primary italic">Mensal Recorrente</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Acesso completo à plataforma do Instituto Behn com cobrança mensal no cartão de crédito. Sem necessidade de limite alto.
          </p>
        </div>

        <div className="max-w-md mx-auto relative">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent-blue rounded-[2rem] blur opacity-25" />

          <Card className="relative border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl rounded-[1.5rem] overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <Sparkles className="text-primary w-6 h-6 animate-pulse" />
            </div>

            <CardHeader className="text-center pt-10">
              <CardTitle className="text-2xl font-bold">Plano Mensal</CardTitle>
              <CardDescription className="text-primary font-medium tracking-wide">
                RECORRENTE • SEM PRAZO
              </CardDescription>
              <div className="mt-6 flex flex-col items-center">
                <span className="text-5xl font-black">R$ 150</span>
                <span className="text-muted-foreground text-sm font-medium mt-1">
                  por mês no cartão de crédito
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 py-8">
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pb-10 px-8">
              <Button
                className="w-full h-14 text-lg font-bold rounded-xl gradient-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                onClick={() => setShowCheckout(true)}
              >
                Assinar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Security badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-tighter">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-tighter">Acesso Imediato</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-sm mx-auto">
              Cobrança recorrente mensal de R$ 150,00 no cartão de crédito.
              Cancele a qualquer momento sem multa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper that renders CheckoutForm with forced monthly mode.
 * Sets the URL search params so CheckoutForm reads them correctly.
 */
function RecurringCheckoutFormWrapper() {
  // We use useEffect to set the search params before CheckoutForm reads them.
  // The CheckoutForm internally reads from useSearchParams for course_id.
  // For platform subscription, it uses its internal paymentMethod state.
  // We need to force it to "monthly" mode without a courseId.
  //
  // The simplest approach: we render CheckoutForm and use a URL param
  // to signal that this is forced-monthly.

  return (
    <div>
      <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm font-bold text-primary">💳 Plano Mensal Recorrente — R$ 150,00/mês</p>
        <p className="text-xs text-muted-foreground mt-1">
          O valor será cobrado automaticamente todo mês no seu cartão de crédito.
        </p>
      </div>
      <CheckoutForm forceMonthly />
    </div>
  );
}

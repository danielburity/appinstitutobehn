import { CheckCircle, Users, TrendingUp, Award, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const BecomeAffiliate = () => {
  const { toast } = useToast();

  const beneficios = [
    {
      icon: Users,
      titulo: "Visibilidade",
      descricao: "Apareça em nossa plataforma para milhares de potenciais clientes"
    },
    {
      icon: TrendingUp,
      titulo: "Crescimento",
      descricao: "Expanda seu negócio com ferramentas de marketing profissionais"
    },
    {
      icon: Award,
      titulo: "Certificação",
      descricao: "Selo de terapeuta certificado Instituto Behn"
    },
    {
      icon: HeartHandshake,
      titulo: "Comunidade",
      descricao: "Networking com outros profissionais da área"
    }
  ];

  const especialidadesDisponiveis = [
    "Hipnose Clínica",
    "PNL",
    "Hipnoterapia",
    "Regressão",
    "Coaching",
    "Terapia Ericksoniana"
  ];

  const steps = [
    { numero: 1, titulo: "Cadastre-se", descricao: "Preencha o formulário com suas informações" },
    { numero: 2, titulo: "Aguarde aprovação", descricao: "Analisaremos suas certificações" },
    { numero: 3, titulo: "Configure perfil", descricao: "Complete seu perfil profissional" },
    { numero: 4, titulo: "Comece a atender", descricao: "Conecte-se com clientes em potencial" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Candidatura Enviada!",
      description: "Analisaremos suas informações e entraremos em contato em breve.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl mb-4 group hover:scale-110 transition-transform duration-500">
        <HeartHandshake className="w-12 h-12 text-white" />
      </div>

      <div className="space-y-4 max-w-2xl px-4">
        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter uppercase italic">
          Seja um Parceiro
        </h1>
        <p className="text-xl md:text-2xl font-bold text-muted-foreground">
          Novas oportunidades estão a caminho.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl px-8 py-3">
        <span className="text-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">
          Em Breve
        </span>
      </div>

      <p className="text-muted-foreground max-w-md px-6 leading-relaxed">
        Estamos preparando algo especial para nossos parceiros. Fique atento às atualizações do Instituto Behn.
      </p>
    </div>
  );
};

export default BecomeAffiliate;

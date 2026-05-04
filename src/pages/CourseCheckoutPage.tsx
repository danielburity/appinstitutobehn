import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Star, Lock, CheckCircle, ShoppingCart, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { CheckoutForm } from "@/components/subscription/CheckoutForm";
import { useSettings } from "@/context/SettingsContext";

export default function CourseCheckoutPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isMember, isAdmin, purchasedCourseIds } = useAuth();
  const { settings } = useSettings();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);

      const { data, error } = await supabase
        .from('courses')
        .select('*, modules(*, lessons(*))')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (data && !error) {
        // Se o curso é Afiliados, redireciona para a assinatura
        if (data.slug === 'afiliados-instituto-behn') {
          navigate('/assinatura', { replace: true });
          return;
        }

        // Se o usuário já comprou ou tem acesso, redireciona para o curso
        if (user) {
          const hasAccess = isAdmin || (!data.is_premium) || purchasedCourseIds.includes(data.id);
          if (hasAccess) {
            navigate(`/curso/${data.slug || data.id}`, { replace: true });
            return;
          }
        }

        // Sort modules and lessons
        const modules = (data.modules || [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((m: any) => ({
            ...m,
            lessons: (m.lessons || []).sort((a: any, b: any) => a.order - b.order),
          }));

        setCourse({
          id: data.id,
          slug: data.slug,
          titulo: data.title,
          imagem: data.image_url,
          badge: data.badge || "Novo",
          instrutor: data.instructor,
          instrutorFoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.instructor,
          duracao: data.duration,
          descricao: data.description,
          oquevocevaiaprender: data.learning_outcomes || ["Fundamentos Essenciais", "Técnicas Avançadas", "Aplicação Prática"],
          modulos: modules.map((m: any) => ({
            titulo: m.title,
            totalAulas: m.lessons?.length || 0,
            aulas: m.lessons?.map((l: any) => ({
              titulo: l.title,
              duracao: l.duration,
            })) || [],
          })),
          is_premium: data.is_premium,
          price: data.price || 0,
        });
      }
      setLoading(false);
    }
    loadCourse();
  }, [slug, user, isAdmin, isMember, purchasedCourseIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando curso...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bold text-lg">Curso não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  const priceFormatted = course.price > 0
    ? `R$ ${(course.price / 100).toFixed(2).replace('.', ',')}`
    : 'R$ 1,00';

  // If checkout is open, show the form
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Compra do Curso</h2>
              <p className="text-muted-foreground">{course.titulo}</p>
            </div>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              ← Voltar
            </Button>
          </div>
          {/* Pass course_id via URL params so CheckoutForm picks it up */}
          <CheckoutForm />
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
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-bold text-lg">{settings.appName}</span>
            )}
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Já tenho conta
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Back */}
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Hero do Curso */}
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl">
          <img
            src={course.imagem}
            alt={course.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                {course.badge && (
                  <Badge className="bg-accent text-accent-foreground">{course.badge}</Badge>
                )}
                <div className="flex items-center gap-1 text-white">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">5.0</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{course.titulo}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <img src={course.instrutorFoto} alt={course.instrutor} className="w-8 h-8 rounded-full" />
                  <span>{course.instrutor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duracao}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Info + Sidebar Preço */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição */}
            <div className="bg-card rounded-xl p-6 border border-border space-y-4">
              <h2 className="text-xl font-bold text-foreground">Sobre o Curso</h2>
              <p className="text-muted-foreground leading-relaxed">{course.descricao}</p>
            </div>

            {/* O que vai aprender */}
            <div className="bg-card rounded-xl p-6 border border-border space-y-4">
              <h2 className="text-xl font-bold text-foreground">O que você vai aprender</h2>
              <ul className="space-y-3">
                {course.oquevocevaiaprender?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conteúdo do Curso */}
            <div className="bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Conteúdo do Curso</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {course.modulos?.length || 0} módulos •{" "}
                  {course.modulos?.reduce((acc: number, m: any) => acc + m.totalAulas, 0) || 0} aulas
                </p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {course.modulos?.map((modulo: any, i: number) => (
                  <AccordionItem key={i} value={`modulo-${i}`}>
                    <AccordionTrigger className="px-6 hover:no-underline text-left">
                      <span className="font-bold text-foreground text-left flex-1 pr-4 leading-tight">
                        {modulo.titulo}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-6 pb-4 space-y-2">
                        {modulo.aulas.map((aula: any, j: number) => (
                          <div
                            key={j}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground text-sm">{aula.titulo}</span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                              {aula.duracao}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Sidebar: Card de Preço */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                {/* Imagem mini */}
                <div className="h-40 overflow-hidden">
                  <img src={course.imagem} alt={course.titulo} className="w-full h-full object-cover" />
                </div>

                <div className="p-6 space-y-6">
                  {/* Preço */}
                  <div className="text-center">
                    <span className="text-4xl font-black text-foreground">{priceFormatted}</span>
                    <p className="text-sm text-muted-foreground mt-1">em até 10x no cartão</p>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-xl gradient-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    onClick={() => {
                      // Set URL params for CheckoutForm
                      const params = new URLSearchParams(window.location.search);
                      params.set('course_id', course.id.toString());
                      params.set('course_title', course.titulo);
                      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                      setShowCheckout(true);
                    }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Comprar Curso
                  </Button>

                  {/* Badges de segurança */}
                  <div className="flex items-center justify-center gap-4 text-muted-foreground/60 pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Pagamento Seguro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Acesso Imediato</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Plataforma Completa */}
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/10 space-y-3 text-center">
                <p className="text-sm font-bold text-foreground">Quer acesso a tudo?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Assine a plataforma e desbloqueie todos os recursos: Terapeutas, Eventos, Curso Afiliados e mais.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/20 text-primary hover:bg-primary/5 font-bold"
                  onClick={() => navigate('/assinatura')}
                >
                  Assinar Plataforma {settings.subscriptionPrice}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

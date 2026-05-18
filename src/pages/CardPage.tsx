import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ShoppingCart, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/context/SettingsContext";

interface CardCourse {
  id: number;
  slug: string;
  title: string;
  image_url: string;
  description: string;
  badge: string;
  instructor: string;
  duration: string;
  price: number;
}

// Slugs that appear on the /card page
const FEATURED_SLUGS = [
  "afiliacao-instituto-behn",
  "hipnose-heriksoniana",
  "hipnose-kids",
  "hipnose-para-emagrecimento",
  "inducoes-hipnoticas",
  "mentefit",
  "pnl-generativa",
  "regressao",
  "reprogramando-o-amor",
  "roteiros-metaforicos",
];

export default function CardPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [courses, setCourses] = useState<CardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, image_url, description, badge, instructor, duration, price")
        .eq("published", true)
        .in("slug", FEATURED_SLUGS)
        .order("title", { ascending: true });

      if (!error && data) {
        setCourses(data as CardCourse[]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const formatPrice = (price: number) => {
    if (!price || price <= 0) return null;
    return `R$ ${(price / 100).toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-bold text-lg text-foreground">{settings.appName}</span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Já tenho conta
            </Button>
            <Button size="sm" className="gradient-primary text-white" onClick={() => navigate("/assinatura")}>
              Assinar Plataforma
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="outline" className="px-4 py-1.5 text-primary border-primary/20 bg-primary/5 text-sm font-bold">
              <Sparkles className="w-4 h-4 mr-1.5 inline-block" />
              Cursos Disponíveis
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              Transforme sua carreira com{" "}
              <span className="text-primary italic">Hipnose e PNL</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore nossos cursos e formações. Clique em um card para saber mais e adquirir acesso imediato.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Cards Grid ─── */}
      <section className="container max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="h-52 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <p className="text-xl text-muted-foreground font-medium">
              Nenhum curso encontrado no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => {
              const priceLabel = formatPrice(course.price);
              const isAffiliation = course.slug === "afiliacao-instituto-behn";

              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/comprar/${course.slug}`)}
                  className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 relative"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Banner/Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badge */}
                    {course.badge && (
                      <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold shadow-lg">
                        {course.badge}
                      </Badge>
                    )}

                    {/* Rating */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white text-xs font-bold">5.0</span>
                    </div>

                    {/* Duration */}
                    {course.duration && (
                      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <span className="text-white text-xs font-medium">{course.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
                        {course.title}
                      </h3>
                      {course.instructor && (
                        <p className="text-sm text-muted-foreground">
                          por <span className="font-medium text-foreground/70">{course.instructor}</span>
                        </p>
                      )}
                    </div>

                    {course.description && (
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    )}

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      {priceLabel ? (
                        <span className="text-xl font-black text-foreground">{priceLabel}</span>
                      ) : (
                        <span className="text-sm font-bold text-primary">Consulte</span>
                      )}
                      <Button
                        size="sm"
                        className="gradient-primary text-white gap-1.5 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.03] transition-all text-xs font-bold px-4"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {isAffiliation ? "Assinar" : "Comprar"}
                      </Button>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center space-y-6 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl p-8 md:p-12 border border-primary/10">
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            Quer acesso a <span className="text-primary italic">tudo</span>?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Assine a plataforma completa e desbloqueie todos os cursos, vitrine de terapeutas, eventos exclusivos e muito mais.
          </p>
          <Button
            size="lg"
            className="gradient-primary text-white font-bold text-lg px-8 rounded-xl shadow-xl hover:scale-[1.03] transition-all"
            onClick={() => navigate("/assinatura")}
          >
            Assinar Plataforma {settings.subscriptionPrice}
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 py-6 bg-card/50">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground/60 font-medium">
            © {new Date().getFullYear()} Instituto Behn de Hipnose e PNL — Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

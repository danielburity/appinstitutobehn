import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/features/CourseCard";
import { EventCard } from "@/components/features/EventCard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Course, AppEvent } from "@/lib/types";
import { useSettings } from "@/context/SettingsContext";

const Home = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: c } = await supabase.from('courses').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3);
      if (c) setCourses(c);

      const { data: e } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(2);
      if (e) setEvents(e);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Banner */}
      <section className="relative bg-primary rounded-2xl p-8 md:p-12 text-primary-foreground overflow-hidden shadow-lg border border-primary-foreground/10">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 whitespace-pre-line leading-tight">
            {settings.dashboardTitle}
          </h1>
          <p className="text-lg mb-6 text-primary-foreground/90 whitespace-pre-line">
            {settings.dashboardSubtitle}
          </p>
          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={() => navigate('/cursos')}
          >
            Explorar Cursos
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl"></div>
        <div className="absolute -right-40 -top-20 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl"></div>
      </section>

      {/* Cursos em Destaque */}
      {courses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Cursos em Destaque
              </h2>
              <p className="text-muted-foreground">Continue sua jornada de aprendizado</p>
            </div>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate('/cursos')}
            >
              Ver Todos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((curso) => (
              <CourseCard key={curso.id} course={curso} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos Eventos */}
      {events.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Próximos Eventos
              </h2>
              <p className="text-muted-foreground">Não perca essas oportunidades</p>
            </div>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate('/eventos')}
            >
              Ver Agenda
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evento) => (
              <EventCard key={evento.id} event={evento} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* CTA Terapeutas */}
      <section className="gradient-accent rounded-2xl p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Encontre um Terapeuta
              </h3>
              <p className="text-white/90">
                Conecte-se com profissionais certificados na sua região
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-accent hover:bg-white/90 flex-shrink-0"
            onClick={() => navigate('/terapeutas')}
          >
            Buscar Terapeutas
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;

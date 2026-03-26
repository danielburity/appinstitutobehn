import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/features/CourseCard";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Course } from "@/lib/types";

const Courses = () => {
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [query, setQuery] = useState("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const filtros = ["Todos", "Iniciante", "Avançado", "Novo", "Popular"];

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCourses(data as Course[]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cursos</h1>
        <p className="text-muted-foreground">
          Explore nossa biblioteca de cursos de Hipnose e PNL
        </p>
        {isAdmin && (
          <Button className="mt-4" onClick={() => navigate('/admin')}>Gerenciar Cursos</Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar cursos..."
          className="pl-10 h-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filtros.map((filtro) => (
          <Badge
            key={filtro}
            variant={filtroAtivo === filtro ? "default" : "outline"}
            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors`}
            onClick={() => setFiltroAtivo(filtro)}
          >
            {filtro}
          </Badge>
        ))}
      </div>

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {useMemo(() => {
          if (loading) return <p>Carregando cursos...</p>;
          if (courses.length === 0) return <p>Nenhum curso encontrado.</p>;

          const normalize = (s: string) => s.toLowerCase();
          const getHours = (duracao: string) => {
            const match = duracao.match(/(\d+)h/);
            return match ? parseInt(match[1], 10) : 0;
          };

          let list = courses.filter((c) =>
            normalize(c.title).includes(normalize(query)) || normalize(c.instructor).includes(normalize(query)),
          );

          if (filtroAtivo === "Novo") list = list.filter((c) => c.badge === "Novo");
          if (filtroAtivo === "Popular") list = list.filter((c) => c.badge === "Popular");
          if (filtroAtivo === "Iniciante") list = list.filter((c) => getHours(c.duration) <= 7);
          if (filtroAtivo === "Avançado") list = list.filter((c) => getHours(c.duration) > 7);

          return list.map((curso) => <CourseCard key={curso.id} course={curso} />);
        }, [filtroAtivo, query, courses, loading])}
      </div>
    </div>
  );
};

export default Courses;

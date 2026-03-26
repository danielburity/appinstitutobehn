import { useNavigate } from "react-router-dom";
import { Clock, Star, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Course } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();
  const { isMember, isAdmin } = useAuth();

  // Mocks for data not yet in DB
  const progresso = 0;
  const avaliacao = 5.0;
  const instrutorFoto = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + course.instructor;

  const hasAccess = isAdmin || (course.slug === 'afiliados-instituto-behn' && isMember);

  const handleNavigate = () => {
     // Permite sempre navegar para os detalhes do curso. Os vídeos estarão bloqueados lá se não tiver acesso.
     navigate(`/curso/${course.slug || course.id}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className={`group cursor-pointer bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-smooth border border-border relative ${!hasAccess ? 'opacity-80 grayscale-[20%]' : ''}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image_url}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
        />
        {course.badge && (
          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
            {course.badge}
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-smooth">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img
            src={instrutorFoto}
            alt={course.instructor}
            className="w-6 h-6 rounded-full"
          />
          <span>{course.instructor}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{avaliacao}</span>
          </div>
        </div>

        {progresso > 0 && (
          <div className="space-y-1">
            <Progress value={progresso} className="h-2" />
            <p className="text-xs text-muted-foreground">{progresso}% completo</p>
          </div>
        )}
      </div>
    </div>
  );
};

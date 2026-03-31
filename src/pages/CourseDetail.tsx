import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Play, CheckCircle, Lock, Clock, Star, ExternalLink, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VideoPlayer } from "@/components/features/VideoPlayer";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isMember, isAdmin } = useAuth();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [selected, setSelected] = useState<{
    id?: string;
    titulo: string;
    videoUrl?: string;
    attachments?: any[];
    description?: string
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Try Supabase first
      // Fetch attachments too nested
      let query = supabase
        .from('courses')
        .select('*, modules(*, lessons(*, lesson_attachments(*)))'); // Nested select

      if (id && isNaN(Number(id))) {
        query = query.eq('slug', id);
      } else {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();

      if (data && !error) {
        // Sign URLs for all attachments
        const modulesWithSignedUrls = await Promise.all(data.modules?.map(async (m: any) => {
          const lessonsWithSigned = await Promise.all(m.lessons?.map(async (l: any) => {
            const attachmentsWithSigned = await Promise.all(l.lesson_attachments?.map(async (a: any) => {
              // Skip if URL is invalid or already a full URL
              if (!a.url || a.url.startsWith('http')) return a;

              try {
                const { data: signed, error } = await supabase.storage
                  .from('course-content')
                  .createSignedUrl(a.url, 3600); // 1 hour

                if (error) {
                  console.warn('Erro ao criar signed URL para anexo:', a.name, error);
                  return a; // Return original if signing fails
                }

                return { ...a, url: signed?.signedUrl || a.url };
              } catch (err) {
                console.warn('Erro ao processar anexo:', a.name, err);
                return a; // Return original on error
              }
            }) || []);

            return { ...l, lesson_attachments: attachmentsWithSigned };
          }) || []);
          return { ...m, lessons: lessonsWithSigned };
        }) || []);

        // Sort modules and lessons
        const modules = modulesWithSignedUrls.sort((a: any, b: any) => a.order - b.order).map((m: any) => ({
          ...m,
          lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
        })) || [];

        // Fetch user progress
        const lessonIds = modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user?.id)
          .in('lesson_id', lessonIds);

        const progressMap: Record<string, boolean> = {};
        progressData?.forEach((p: any) => {
          progressMap[p.lesson_id] = p.completed;
        });

        // Calculate total progress
        const totalLessons = lessonIds.length;
        const completedLessons = Object.values(progressMap).filter(Boolean).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Calculate mapped structure
        setCourse({
          id: data.id,
          slug: data.slug,
          titulo: data.title,
          imagem: data.image_url,
          badge: data.badge || "Novo",
          avaliacao: 5.0, // Default
          instrutor: data.instructor,
          instrutorFoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.instructor,
          duracao: data.duration,
          progresso: progressPercentage,
          descricao: data.description,
          oquevocevaiaprender: data.learning_outcomes || ["Fundamentos Essenciais", "Técnicas Avançadas", "Aplicação Prática"],
          modulos: modules.map((m: any) => ({
            titulo: m.title,
            aulas: m.lessons.map((l: any) => ({
              id: l.id,
              titulo: l.title,
              duracao: l.duration,
              status: progressMap[l.id] ? "completed" : "unlocked", // We will update this right after the map
              videoUrl: l.video_url,
              description: l.description,
              attachments: l.lesson_attachments
            }))
          })),
          videoUrl: data.video_url,
          externalUrl: data.external_url,
          is_premium: data.is_premium
        });

        // Update module status based on global access rule after state is set, actually we can just do it in render or here.
      }
      setLoading(false);
    }
    if (user) load();
  }, [id, user]);



  if (loading) return <div>Carregando...</div>;
  if (!course) return <div>Curso não encontrado</div>;

  const hasAccess = isAdmin || (course.slug === 'afiliados-instituto-behn' && isMember);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "current":
        return <Play className="w-5 h-5 text-accent" />;
      case "locked":
        return <Lock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Play className="w-5 h-5 text-muted-foreground opacity-50" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2 -ml-2"
        onClick={() => navigate('/cursos')}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Cursos
      </Button>

      {/* Header do Curso */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden">
        <img
          src={course.imagem}
          alt={course.titulo}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              {course.badge && (
                <Badge className="bg-accent text-accent-foreground">
                  {course.badge}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-white">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{course.avaliacao}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {course.titulo}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <img
                  src={course.instrutorFoto}
                  alt={course.instrutor}
                  className="w-8 h-8 rounded-full"
                />
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

      {/* Barra de Progresso */}
      {course.progresso > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">Seu Progresso</span>
            <span className="text-accent font-bold">{course.progresso}%</span>
          </div>
          <Progress value={course.progresso} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Continue aprendendo para completar este curso
          </p>
        </div>
      )}

      {/* CTA Button */}
      {hasAccess ? (
        <Button
          className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          onClick={() => navigate(`/curso/${course.slug || course.id}/assistir`)}
        >
          {course.progresso > 0 ? "Continuar Assistindo" : "Começar Curso"}
        </Button>
      ) : course.slug === 'afiliados-instituto-behn' ? (
        <Button
          className="w-full md:w-auto bg-slate-800 text-white hover:bg-slate-700"
          size="lg"
          onClick={() => navigate('/subscription')}
        >
          <Lock className="w-4 h-4 mr-2" />
          Assinar Plataforma
        </Button>
      ) : course.externalUrl ? (
        <Button
          className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          onClick={() => window.open(course.externalUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Comprar Curso
        </Button>
      ) : (
        <Button
          className="w-full md:w-auto bg-slate-800 text-white cursor-not-allowed opacity-80"
          size="lg"
        >
          <Lock className="w-4 h-4 mr-2" />
          Comprar Curso
        </Button>
      )}

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="visao-geral" className="flex-1 md:flex-none">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="conteudo" className="flex-1 md:flex-none">
            Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-foreground">Sobre o Curso:</h2>
              <span className="text-lg font-medium text-muted-foreground">{selected?.titulo || "Visão Geral"}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {selected?.description || course.descricao}
            </p>

            {/* Attachments Section if selected */}
            {selected?.attachments && selected.attachments.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Materiais de Apoio
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selected.attachments.map((att: any) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <FileText className="w-4 h-4 mr-3 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="flex-1 break-all text-sm">{att.name}</span>
                      <Download className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              O que você vai aprender
            </h2>
            <ul className="space-y-3">
              {course.oquevocevaiaprender?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Show Main Video if available and no specific lesson selected */}
          <VideoPlayer url={selected?.videoUrl || course.videoUrl} title={selected?.titulo || course.titulo} />
        </TabsContent>

        <TabsContent value="conteudo" className="mt-6">
          <div className="bg-card rounded-xl border border-border">
            <Accordion type="single" collapsible className="w-full">
              {course.modulos?.map((modulo: any, moduloIndex: number) => (
                <AccordionItem key={moduloIndex} value={`modulo-${moduloIndex}`}>
                  <AccordionTrigger className="px-6 hover:no-underline text-left">
                    <span className="font-bold text-foreground text-left flex-1 pr-4 leading-tight">{modulo.titulo}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-2">
                      {modulo.aulas.map((aula: any, aulaIndex: number) => {
                        const isLessonLocked = !hasAccess;
                        const displayStatus = isLessonLocked ? "locked" : aula.status;
                        
                        return (
                        <div
                          key={aulaIndex}
                          className={`flex items-center justify-between p-4 rounded-lg transition-smooth ${isLessonLocked
                            ? "bg-muted/50 cursor-not-allowed"
                            : "bg-muted hover:bg-muted/80 cursor-pointer"
                            }`}
                          onClick={() => {
                            if (!isLessonLocked) {
                              navigate(`/curso/${course.slug || course.id}/assistir?lesson=${aula.id}`);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0 pt-0.5">
                            <div className="shrink-0 mt-0.5">{getStatusIcon(displayStatus)}</div>
                            <span
                              className={`text-left break-words ${isLessonLocked
                                  ? "text-muted-foreground"
                                  : "text-foreground font-medium"
                                }`}
                            >
                              {aula.titulo}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground ml-4 flex-shrink-0">
                            {aula.duracao}
                          </span>
                        </div>
                      )})}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetail;

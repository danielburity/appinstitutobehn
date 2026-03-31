import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WelcomePopup } from '@/components/features/WelcomePopup';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileText, Download, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VideoPlayer } from '@/components/features/VideoPlayer';
import { LessonSidebar } from '@/components/features/LessonSidebar';
import { StarRating } from '@/components/features/StarRating';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function CoursePlayer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user, isMember, isAdmin } = useAuth();
    const [course, setCourse] = useState<any | null>(null);
    const [currentLesson, setCurrentLesson] = useState<any | null>(null);
    const [progress, setProgress] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        loadCourseData();
    }, [courseId, user]);

    async function loadCourseData() {
        if (!courseId || !user) return;

        setLoading(true);
        setCourse(null);
        setProgress({});
        setCurrentLesson(null);

        // Load course with modules and lessons
        let query = supabase
            .from('courses')
            .select('*, modules(*, lessons(*, lesson_attachments(*)))');

        if (courseId && isNaN(Number(courseId))) {
            query = query.eq('slug', courseId);
        } else {
            query = query.eq('id', courseId);
        }

        const { data: courseData, error: courseError } = await query.single();

        if (courseError || !courseData) {
            toast.error('Erro ao carregar curso');
            navigate('/cursos');
            return;
        }

        // Check premium status
        const hasAccess = isAdmin || (courseData.slug === 'afiliados-instituto-behn' && isMember);
        if (!hasAccess) {
            toast.error('Você não tem acesso a este curso.');
            navigate(`/curso/${courseData.slug || courseData.id}`);
            return;
        }

        // Sign URLs for attachments
        const modulesWithSignedUrls = await Promise.all(courseData.modules?.map(async (m: any) => {
            const lessonsWithSigned = await Promise.all(m.lessons?.map(async (l: any) => {
                const attachmentsWithSigned = await Promise.all(l.lesson_attachments?.map(async (a: any) => {
                    if (!a.url || a.url.startsWith('http')) return a;

                    try {
                        const { data: signed, error } = await supabase.storage
                            .from('course-content')
                            .createSignedUrl(a.url, 3600);

                        if (error) {
                            console.warn('Erro ao criar signed URL para anexo:', a.name, error);
                            return a;
                        }

                        return { ...a, url: signed?.signedUrl || a.url };
                    } catch (err) {
                        console.warn('Erro ao processar anexo:', a.name, err);
                        return a;
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

        // Map to course structure
        const mappedCourse = {
            id: courseData.id,
            titulo: courseData.title,
            imagem: courseData.image_url,
            instrutor: courseData.instructor,
            modulos: modules.map((m: any) => ({
                titulo: m.title,
                aulas: m.lessons.map((l: any) => ({
                    id: l.id,
                    titulo: l.title,
                    duracao: l.duration,
                    videoUrl: l.video_url,
                    description: l.description,
                    attachments: l.lesson_attachments
                }))
            }))
        };

        setCourse(mappedCourse);

        // Load user progress
        const lessonIds = mappedCourse.modulos.flatMap((m: any) => m.aulas.map((a: any) => a.id));
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);

        const progressMap: Record<string, boolean> = {};
        progressData?.forEach((p: any) => {
            progressMap[p.lesson_id] = p.completed;
        });
        setProgress(progressMap);

        const searchParams = new URLSearchParams(window.location.search);
        const urlLessonId = searchParams.get('lesson');

        let startLesson = null;

        // Se houver ID pela URL, prioriza localizar esta aula em específico
        if (urlLessonId) {
            for (const module of mappedCourse.modulos) {
                for (const aula of module.aulas) {
                    if (aula.id === urlLessonId) {
                        startLesson = aula;
                        break;
                    }
                }
                if (startLesson) break;
            }
        }

        // Caso contrário, busca a primeira incompleta
        if (!startLesson) {
            for (const module of mappedCourse.modulos) {
                for (const aula of module.aulas) {
                    if (!progressMap[aula.id]) {
                        startLesson = aula;
                        break;
                    }
                }
                if (startLesson) break;
            }
        }

        // If all completed and no specific url target, start from first lesson
        if (!startLesson && mappedCourse.modulos[0]?.aulas[0]) {
            startLesson = mappedCourse.modulos[0].aulas[0];
        }

        setCurrentLesson(startLesson);
        setLoading(false);
    }

    async function markLessonComplete(lessonId: string) {
        if (!user) return;

        const { error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString()
            });

        if (!error) {
            setProgress(prev => ({ ...prev, [lessonId]: true }));
            toast.success('Aula concluída! 🎉');
        }
    }

    async function updateLessonDuration(lessonId: string, duration: string) {
        if (currentLesson && currentLesson.id === lessonId && (!currentLesson.duracao || currentLesson.duracao === "00:00")) {
            const { error } = await supabase
                .from('lessons')
                .update({ duration })
                .eq('id', lessonId);

            if (!error) {
                console.log(`Duration updated for lesson ${lessonId}: ${duration}`);
                setCurrentLesson((prev: any) => prev?.id === lessonId ? { ...prev, duracao: duration } : prev);
            }
        }
    }

    async function advanceToNextLesson() {
        const nextLesson = findNextLesson(currentLesson?.id);
        if (nextLesson) {
            setTimeout(() => {
                setCurrentLesson(nextLesson);
                toast.info(`Próxima aula: ${nextLesson.titulo}`);
            }, 1500);
        } else {
            toast.success('Parabéns! Você concluiu o curso! 🎊');
        }
    }

    function findNextLesson(currentLessonId?: string) {
        if (!course || !currentLessonId) return null;

        let foundCurrent = false;
        for (const module of course.modulos) {
            for (const aula of module.aulas) {
                if (foundCurrent) {
                    return aula;
                }
                if (aula.id === currentLessonId) {
                    foundCurrent = true;
                }
            }
        }
        return null;
    }

    function findPreviousLesson(currentLessonId?: string) {
        if (!course || !currentLessonId) return null;

        let previous = null;
        for (const module of course.modulos) {
            for (const aula of module.aulas) {
                if (aula.id === currentLessonId) {
                    return previous;
                }
                previous = aula;
            }
        }
        return null;
    }

    const nextLesson = findNextLesson(currentLesson?.id);
    const prevLesson = findPreviousLesson(currentLesson?.id);

    async function toggleLessonComplete() {
        if (!user || !currentLesson) return;

        const isCurrentlyCompleted = progress[currentLesson.id];

        if (isCurrentlyCompleted) {
            // Unmark as complete
            const { error } = await supabase
                .from('user_progress')
                .delete()
                .eq('user_id', user.id)
                .eq('lesson_id', currentLesson.id);

            if (!error) {
                setProgress(prev => ({ ...prev, [currentLesson.id]: false }));
                toast.info('Aula desmarcada como concluída');
            }
        } else {
            // Mark as complete
            await markLessonComplete(currentLesson.id);
            // Automatic advance when manually marked complete
            await advanceToNextLesson();
        }
    }

    async function handleVideoEnded() {
        if (!currentLesson) return;
        if (progress[currentLesson.id]) {
            // If already completed, just advance
            await advanceToNextLesson();
            return;
        }
        await markLessonComplete(currentLesson.id);
        await advanceToNextLesson();
    }

    function calculateProgress() {
        if (!course || !course.modulos) return 0;

        let totalLessons = 0;
        let completedCount = 0;

        course.modulos.forEach((modulo: any) => {
            if (modulo.aulas) {
                totalLessons += modulo.aulas.length;
                modulo.aulas.forEach((aula: any) => {
                    if (progress[aula.id]) {
                        completedCount++;
                    }
                });
            }
        });

        return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Carregando curso...</p>
            </div>
        );
    }

    if (!course || !currentLesson) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Curso não encontrado</p>
            </div>
        );
    }

    const progressPercentage = calculateProgress();

    return (
        <div className="h-screen flex flex-col relative">
            <WelcomePopup />
            {/* Header */}
            <div className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/curso/${courseId}`)}
                        className="px-2 md:px-3 flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 md:mr-2" />
                        <span className="hidden md:inline">Voltar</span>
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-base md:text-lg line-clamp-2 md:line-clamp-none leading-tight mb-0.5">{course.titulo}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Progresso: {progressPercentage}%
                        </p>
                    </div>
                </div>
                <Progress value={progressPercentage} className="w-24 md:w-48 bg-slate-200/50 hidden sm:block flex-shrink-0" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 hidden md:block">
                    <LessonSidebar
                        modules={course.modulos}
                        currentLessonId={currentLesson.id}
                        onLessonSelect={setCurrentLesson}
                        progress={progress}
                    />
                </div>

                {/* Video Player Area */}
                <div className="flex-1 overflow-y-auto bg-background p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Video Player */}
                        <div>
                            {currentLesson.videoUrl ? (
                                <VideoPlayer
                                    url={currentLesson.videoUrl}
                                    title={currentLesson.titulo}
                                    onEnded={handleVideoEnded}
                                    onDurationDetected={(duration) => updateLessonDuration(currentLesson.id, duration)}
                                />
                            ) : (
                                <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col items-center justify-center p-12 text-center h-[300px] sm:h-[400px]">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Conteúdo em Texto/Anexos</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Esta aula não possui vídeo. Consulte a descrição e os materiais de apoio abaixo para continuar seu aprendizado.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lesson Info */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="space-y-4 flex-1">
                                    <h2 className="text-2xl font-bold">{currentLesson.titulo}</h2>
                                    <StarRating lessonId={currentLesson.id} />
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
                                    <div className="flex flex-wrap items-center gap-2 w-full">
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                                                disabled={!prevLesson}
                                                className="flex-1 sm:flex-none px-2 sm:px-3 text-xs sm:text-sm"
                                            >
                                                <ChevronLeft className="w-4 h-4 sm:mr-1" />
                                                <span className="hidden sm:inline">Anterior</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                                                disabled={!nextLesson}
                                                className="flex-1 sm:flex-none px-2 sm:px-3 text-xs sm:text-sm"
                                            >
                                                <span className="hidden sm:inline">Próxima</span>
                                                <ChevronRight className="w-4 h-4 sm:ml-1" />
                                            </Button>
                                        </div>

                                        <div className="w-px h-8 bg-border hidden sm:block" />

                                        <Button
                                            onClick={toggleLessonComplete}
                                            variant={progress[currentLesson.id] ? "default" : "outline"}
                                            className={`w-full sm:w-auto text-xs sm:text-sm py-2 h-auto whitespace-normal ${progress[currentLesson.id] ? "bg-green-600 hover:bg-green-700" : ""}`}
                                        >
                                            {progress[currentLesson.id] ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                                    Concluída
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                                                    Marcar como Concluída
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/80 lowercase tracking-wider font-semibold mt-1 text-center sm:text-right w-full sm:w-auto">
                                        * Marque como concluída para validar o progresso
                                    </span>
                                </div>
                            </div>
                            {currentLesson.description && (
                                <p className="text-muted-foreground">{currentLesson.description}</p>
                            )}
                        </div>

                        {/* Attachments */}
                        {currentLesson.attachments && currentLesson.attachments.length > 0 && (
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Materiais de Apoio
                                </h3>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {currentLesson.attachments.map((att: any) => (
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
                </div>
            </div>
        </div>
    );
}

import { CheckCircle, Play, Lock, Circle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

interface Lesson {
    id: string;
    titulo: string;
    duracao: string;
    videoUrl?: string;
    completed?: boolean;
}

interface Module {
    titulo: string;
    aulas: Lesson[];
}

interface LessonSidebarProps {
    modules: Module[];
    currentLessonId?: string;
    onLessonSelect: (lesson: Lesson) => void;
    progress: Record<string, boolean>; // lessonId -> completed
}

export function LessonSidebar({ modules, currentLessonId, onLessonSelect, progress }: LessonSidebarProps) {
    const getStatusIcon = (lesson: Lesson) => {
        const isCompleted = progress[lesson.id];
        const isCurrent = lesson.id === currentLessonId;

        if (isCompleted) {
            return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
        }
        if (isCurrent) {
            return <Play className="w-5 h-5 text-accent flex-shrink-0" />;
        }
        return <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
    };

    return (
        <div className="h-full bg-card border-r border-border overflow-y-auto">
            <div className="p-4 border-b border-border">
                <h2 className="font-bold text-lg">Conteúdo do Curso</h2>
            </div>

            <Accordion type="multiple" defaultValue={modules.map((_, i) => `module-${i}`)} className="w-full">
                {modules.map((module, moduleIndex) => (
                    <AccordionItem key={moduleIndex} value={`module-${moduleIndex}`} className="border-b border-border">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                            <span className="font-semibold text-sm text-left">{module.titulo}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                            <div className="space-y-1">
                                {module.aulas.map((aula) => {
                                    const isCompleted = progress[aula.id];
                                    const isCurrent = aula.id === currentLessonId;

                                    return (
                                        <button
                                            key={aula.id}
                                            onClick={() => onLessonSelect(aula)}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-3 text-left transition-colors",
                                                isCurrent
                                                    ? "bg-accent/10 border-l-2 border-accent"
                                                    : "hover:bg-muted/50",
                                                isCompleted && !isCurrent && "opacity-70"
                                            )}
                                        >
                                            {getStatusIcon(aula)}
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium line-clamp-2",
                                                    isCurrent && "text-accent"
                                                )}>
                                                    {aula.titulo}
                                                </p>
                                                {aula.duracao && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {aula.duracao}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

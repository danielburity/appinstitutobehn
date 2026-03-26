import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Course, Module, Lesson } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, GripVertical, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LessonEditor } from './LessonEditor';

// Dnd Kit Imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { toast } from 'sonner';

interface CourseContentManagerProps {
    course: Course;
    onBack: () => void;
}

export function CourseContentManager({ course, onBack }: CourseContentManagerProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLesson, setEditingLesson] = useState<{ lesson?: Lesson, moduleId: string } | null>(null);
    const [moduleDialog, setModuleDialog] = useState<{ open: boolean, mode: 'create' | 'edit', initialTitle?: string, id?: string }>({ open: false, mode: 'create' });
    const [moduleTitle, setModuleTitle] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadModules();
    }, [course.id]);

    useEffect(() => {
        if (moduleDialog.open) {
            setModuleTitle(moduleDialog.initialTitle || "");
        }
    }, [moduleDialog.open, moduleDialog.initialTitle]);

    const loadModules = async () => {
        setLoading(true);
        const { data: modulesData, error: modulesError } = await supabase
            .from('modules')
            .select('*, lessons(*)')
            .eq('course_id', course.id)
            .order('order', { ascending: true });

        if (modulesError) {
            console.error('Error loading modules:', modulesError);
            return;
        }

        const sortedModules = modulesData?.map((m: any) => ({
            ...m,
            lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
        })) || [];

        setModules(sortedModules);
        setLoading(false);
    };

    const handleSaveModule = async () => {
        if (!moduleTitle.trim()) return;

        if (moduleDialog.mode === 'create') {
            const { error } = await supabase.from('modules').insert([{
                course_id: course.id,
                title: moduleTitle,
                order: modules.length
            }]);
            if (error) toast.error('Erro ao criar módulo');
            else toast.success('Módulo criado!');
        } else if (moduleDialog.mode === 'edit' && moduleDialog.id) {
            const { error } = await supabase.from('modules').update({ title: moduleTitle }).eq('id', moduleDialog.id);
            if (error) toast.error('Erro ao atualizar módulo');
            else toast.success('Módulo atualizado!');
        }

        setModuleDialog({ ...moduleDialog, open: false });
        loadModules();
    };

    const deleteModule = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza? Isso apagará todas as aulas deste módulo.')) return;
        const { error } = await supabase.from('modules').delete().eq('id', id);
        if (error) toast.error('Erro ao excluir módulo');
        else {
            toast.success('Módulo excluído!');
            loadModules();
        }
    };

    const deleteLesson = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error) toast.error('Erro ao excluir aula');
        else {
            toast.success('Aula excluída!');
            loadModules();
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setModules((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Persist order to DB
                newItems.forEach(async (item, index) => {
                    await supabase.from('modules').update({ order: index }).eq('id', item.id);
                });

                return newItems;
            });
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        toast.loading('Iniciando importação de aulas...', { id: 'csv-upload-modules' });
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

            const moduleMap = new Map<string, string>(); // titulo -> id
            
            // pre-fill moduleMap with existing modules to avoid duplicates
            modules.forEach(m => moduleMap.set(m.title, m.id));

            const headerLine = lines[0].split(';').map(h => h.trim().toLowerCase());
            const modTitleIdx = headerLine.indexOf('modulo_titulo');
            const modOrderIdx = headerLine.indexOf('modulo_ordem');
            const lesTitleIdx = headerLine.indexOf('aula_titulo');
            const lesVideoIdx = headerLine.indexOf('aula_video_url');
            const lesDescIdx = headerLine.indexOf('aula_descricao');
            const lesDurIdx = headerLine.indexOf('aula_duracao');
            const lesOrderIdx = headerLine.indexOf('aula_ordem');

            // Fallbacks in case headers are malformed but columns are in order
            const fallbackModTitle = modTitleIdx >= 0 ? modTitleIdx : 0;
            const fallbackModOrder = modOrderIdx >= 0 ? modOrderIdx : 1;
            const fallbackLesTitle = lesTitleIdx >= 0 ? lesTitleIdx : 2;
            const fallbackLesVideo = lesVideoIdx >= 0 ? lesVideoIdx : 3;
            const fallbackLesDesc  = lesDescIdx >= 0 ? lesDescIdx : 4;
            const fallbackLesDur   = lesDurIdx >= 0 ? lesDurIdx : 5;
            const fallbackLesOrder = lesOrderIdx >= 0 ? lesOrderIdx : 6;

            for (const line of dataLines) {
                const parts = line.split(';');
                if (parts.length < 3) continue;

                const modulo_titulo = parts[fallbackModTitle]?.trim();
                const modulo_ordem = parseInt(parts[fallbackModOrder]?.trim() || '0');
                const aula_titulo = parts[fallbackLesTitle]?.trim();
                const aula_video_url = parts[fallbackLesVideo]?.trim() || '';
                const aula_descricao = parts[fallbackLesDesc]?.trim() || '';
                const aula_duracao = parts[fallbackLesDur]?.trim() || '';
                const aula_ordem = parseInt(parts[fallbackLesOrder]?.trim() || '0');

                if (!modulo_titulo || !aula_titulo) continue;

                let modId = moduleMap.get(modulo_titulo);
                if (!modId) {
                    const { data: newMod, error: errMod } = await supabase.from('modules').insert({
                        course_id: course.id,
                        title: modulo_titulo,
                        order: modulo_ordem
                    }).select('id').single();
                    if (errMod) throw new Error(`Erro ao criar módulo ${modulo_titulo}: ${errMod.message}`);
                    modId = newMod.id;
                    moduleMap.set(modulo_titulo, modId);
                }

                const { data: lessonData } = await supabase.from('lessons').select('id').eq('module_id', modId).eq('title', aula_titulo).maybeSingle();
                if (!lessonData) {
                    const { error: errLess } = await supabase.from('lessons').insert({
                        module_id: modId,
                        title: aula_titulo,
                        order: aula_ordem,
                        video_url: aula_video_url,
                        description: aula_descricao,
                        duration: aula_duracao,
                        visible: true,
                        release_days: 0
                    });
                    if (errLess) throw new Error(`Erro ao criar aula ${aula_titulo}: ${errLess.message}`);
                }
            }
            toast.success('Aulas importadas com sucesso!', { id: 'csv-upload-modules' });
            await loadModules();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro na importação: ' + error.message, { id: 'csv-upload-modules' });
        } finally {
            setLoading(false);
            if (e.target) e.target.value = '';
        }
    };

    if (editingLesson) {
        return (
            <div className="bg-background pt-6">
                <LessonEditor
                    moduleId={editingLesson.moduleId}
                    lesson={editingLesson.lesson}
                    onSave={() => {
                        setEditingLesson(null);
                        loadModules();
                    }}
                    onCancel={() => setEditingLesson(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={onBack} className="mb-2 pl-0 hover:pl-2 transition-all">← Voltar para Cursos</Button>
                    <h2 className="text-2xl font-bold">Conteúdo: {course.title}</h2>
                    <p className="text-muted-foreground">Gerencie módulos e aulas do curso</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="file" accept=".csv" id="module-csv-upload" style={{ display: 'none' }} onChange={handleCsvUpload} />
                    <Button variant="outline" onClick={() => document.getElementById('module-csv-upload')?.click()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Importar Aulas
                    </Button>
                    <Button onClick={() => setModuleDialog({ open: true, mode: 'create' })}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Módulo
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>Carregando conteúdo...</div>
            ) : (
                <div className="space-y-4">
                    {modules.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            Nenhum módulo criado ainda. Clique em "Novo Módulo" para começar.
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={modules.map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {modules.map((module) => (
                                    <SortableItem key={module.id} id={module.id}>
                                        {({ attributes, listeners }) => (
                                            <AccordionItem value={module.id} className="border rounded-lg bg-card px-4">
                                                <div className="flex items-center py-4">
                                                    {/* Apply drag listeners ONLY to the handle */}
                                                    <div {...attributes} {...listeners} className="cursor-grab focus:outline-none mr-4">
                                                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                                                    </div>

                                                    <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                                        <span className="font-semibold text-lg text-left">{module.title}</span>
                                                    </AccordionTrigger>

                                                    <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModuleDialog({ open: true, mode: 'edit', initialTitle: module.title, id: module.id });
                                                        }}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => deleteModule(module.id, e)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <AccordionContent className="pt-2 pb-4 space-y-2">
                                                    {module.lessons?.map((lesson) => (
                                                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md group hover:bg-muted transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium">{lesson.title}</span>
                                                                {!lesson.visible && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Oculta</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingLesson({ moduleId: module.id, lesson })}>
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteLesson(lesson.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        variant="outline"
                                                        className="w-full mt-4 border-dashed"
                                                        onClick={() => setEditingLesson({ moduleId: module.id })}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Adicionar Aula
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </SortableItem>
                                ))}
                            </Accordion>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            <Dialog open={moduleDialog.open} onOpenChange={(open) => setModuleDialog(prev => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{moduleDialog.mode === 'create' ? 'Novo Módulo' : 'Editar Módulo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <span className="text-sm font-medium">Título do Módulo</span>
                            <Input
                                value={moduleTitle}
                                onChange={(e) => setModuleTitle(e.target.value)}
                                placeholder="Ex: Introdução"
                            />
                        </div>
                        <Button onClick={handleSaveModule} className="w-full">
                            {moduleDialog.mode === 'create' ? 'Criar Módulo' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

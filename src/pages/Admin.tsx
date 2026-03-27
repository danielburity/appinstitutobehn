import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings, AppSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2, Edit2, BookOpen, Upload, Package, Camera } from 'lucide-react';
import { Course, Therapist, AppEvent, Material } from '@/lib/types';
import { hexToHsl, hslToHex } from '@/lib/utils';
import { CourseContentManager } from '@/components/admin/CourseContentManager';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';

function generateSlug(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
}

const ColorField = ({ label, hslValue, onChange }: { label: string, hslValue: string, onChange: (hsl: string) => void }) => {
  const [text, setText] = useState(hslToHex(hslValue).toUpperCase());
  
  useEffect(() => {
    setText(hslToHex(hslValue).toUpperCase());
  }, [hslValue]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
         <input type="color" className="w-12 h-12 p-1 rounded border shadow-sm cursor-pointer" 
           value={hslToHex(hslValue)} 
           onChange={e => onChange(hexToHsl(e.target.value))}
         />
         <Input 
           value={text} 
           onChange={e => setText(e.target.value)}
           onBlur={() => {
             let val = text.trim();
             if (!val.startsWith('#')) val = '#' + val;
             if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
               onChange(hexToHsl(val));
             } else {
               setText(hslToHex(hslValue).toUpperCase());
             }
           }}
           className="font-mono uppercase transition-colors focus:border-primary" 
         />
      </div>
    </div>
  );
};

export default function Admin() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    duration: '',
    image_url: '',
    description: '',
    published: true,
    is_premium: false,
    video_url: '',
    external_url: '',
    badge: '',
    learning_outcomes: ''
  });
  const [therapistForm, setTherapistForm] = useState({ name: '', city: '', state: '', postal_code: '', specialties: '', selo_approved: false, gender: 'female', avatar_url: '', rating: '', contact_whatsapp: '' });
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'online', featured: false, external_url: '', image_url: '', description: '', category: '', location: '' });
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', image_url: '', external_url: '', price: '', category: '' });

  const [managingContentCourse, setManagingContentCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [appearanceForm, setAppearanceForm] = useState<AppSettings>(settings);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialEditDialogOpen, setMaterialEditDialogOpen] = useState(false);
  const [therapistEditDialogOpen, setTherapistEditDialogOpen] = useState(false);
  const [eventEditDialogOpen, setEventEditDialogOpen] = useState(false);

  // Sync appearance form with context on load
  useEffect(() => {
    setAppearanceForm(settings);
  }, [settings]);

  // Load Data
  async function loadData() {
    setLoading(true);
    const { data: c } = await supabase.from('courses').select('*').order('updated_at', { ascending: false });
    const { data: t } = await supabase.from('therapists').select('*').order('updated_at', { ascending: false });
    const { data: e } = await supabase.from('events').select('*').order('updated_at', { ascending: false });
    const { data: m } = await supabase.from('materials').select('*').order('updated_at', { ascending: false });

    if (c) setCourses(c);
    if (t) setTherapists(t);
    if (e) setEvents(e);
    if (m) setMaterials(m);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Delete Actions
  async function deleteItem(table: string, id: string | number) {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast.error('Erro ao excluir: ' + error.message);
    else {
      toast.success('Excluído com sucesso!');
      loadData();
    }
  }

  // Create Actions
  async function createCourse() {
    setLoading(true);
    const outcomes = courseForm.learning_outcomes.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('courses').insert({
      ...courseForm,
      slug: generateSlug(courseForm.title),
      learning_outcomes: outcomes,
      created_by: user?.id
    });
    setLoading(false);
    if (error) toast.error('Erro: ' + error.message);
    else {
      toast.success('Curso criado!');
      loadData();
      setCourseForm({
        title: '',
        instructor: '',
        duration: '',
        image_url: '',
        description: '',
        published: true,
        is_premium: false,
        video_url: '',
        external_url: '',
        badge: '',
        learning_outcomes: ''
      });
    }
  }

  async function createTherapist() {
    setLoading(true);
    const specs = therapistForm.specialties.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('therapists').insert({
      ...therapistForm,
      specialties: specs,
      avatar_url: therapistForm.avatar_url || null
    });
    setLoading(false);
    if (error) toast.error('Erro: ' + error.message);
    else {
      toast.success('Terapeuta criado!');
      loadData();
      setTherapistForm({ name: '', city: '', state: '', postal_code: '', specialties: '', selo_approved: false, gender: 'female', avatar_url: '', rating: '', contact_whatsapp: '' });
    }
  }

  async function createEvent() {
    setLoading(true);
    const { error } = await supabase.from('events').insert({
      ...eventForm,
      external_url: eventForm.external_url || null,
      image_url: eventForm.image_url || null
    });
    setLoading(false);
    if (error) toast.error('Erro: ' + error.message);
    else {
      toast.success('Evento criado!');
      loadData();
      setEventForm({ title: '', date: '', type: 'online', featured: false, external_url: '', image_url: '', description: '', category: '', location: '' });
    }
  }

  async function createMaterial() {
    setLoading(true);
    const { error } = await supabase.from('materials').insert({
      ...materialForm,
      created_by: user?.id
    });
    setLoading(false);
    if (error) toast.error('Erro: ' + error.message);
    else {
      toast.success('Material criado!');
      loadData();
      setMaterialForm({ title: '', description: '', image_url: '', external_url: '', price: '', category: '' });
    }
  }



  async function updateCourse() {
    if (!editingCourse) return;
    setLoading(true);
    const outcomes = courseForm.learning_outcomes.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('courses').update({
      ...courseForm,
      slug: generateSlug(courseForm.title),
      learning_outcomes: outcomes
    }).eq('id', editingCourse.id);
    setLoading(false);
    if (error) toast.error('Erro ao atualizar: ' + error.message);
    else {
      toast.success('Curso atualizado!');
      loadData();
      setEditDialogOpen(false);
      setEditingCourse(null);
      setCourseForm({
        title: '',
        instructor: '',
        duration: '',
        image_url: '',
        description: '',
        published: true,
        is_premium: false,
        video_url: '',
        external_url: '',
        badge: '',
        learning_outcomes: ''
      });
    }
  }

  function openEditDialog(course: Course) {
    setEditingCourse(course);
    setCourseForm({
      title: course.title || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
      image_url: course.image_url || '',
      description: course.description || '',
      published: course.published ?? true,
      is_premium: course.is_premium ?? false,
      video_url: course.video_url || '',
      external_url: course.external_url || '',
      badge: course.badge || '',
      learning_outcomes: course.learning_outcomes?.join(', ') || ''
    });
    setEditDialogOpen(true);
  }

  function openEditMaterialDialog(material: Material) {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title || '',
      description: material.description || '',
      image_url: material.image_url || '',
      external_url: material.external_url || '',
      price: material.price || '',
      category: material.category || ''
    });
    setMaterialEditDialogOpen(true);
  }

  async function updateMaterial() {
    if (!editingMaterial) return;
    setLoading(true);
    const { error } = await supabase.from('materials').update(materialForm).eq('id', editingMaterial.id);
    setLoading(false);
    if (error) toast.error('Erro ao atualizar: ' + error.message);
    else {
      toast.success('Material atualizado!');
      loadData();
      setMaterialEditDialogOpen(false);
      setEditingMaterial(null);
      setMaterialForm({ title: '', description: '', image_url: '', external_url: '', price: '', category: '' });
    }
  }

  function openEditTherapistDialog(therapist: Therapist) {
    setEditingTherapist(therapist);
    setTherapistForm({
      name: therapist.name || '',
      gender: therapist.gender || 'female',
      city: therapist.city || '',
      state: therapist.state || '',
      postal_code: therapist.postal_code || '',
      specialties: therapist.specialties?.join(', ') || '',
      selo_approved: therapist.selo_approved || false,
      avatar_url: therapist.avatar_url || '',
      rating: therapist.rating?.toString() || '',
      contact_whatsapp: therapist.contact_whatsapp || ''
    });
    setTherapistEditDialogOpen(true);
  }

  async function updateTherapist() {
    if (!editingTherapist) return;
    setLoading(true);
    const specs = therapistForm.specialties.split(',').map(s => s.trim()).filter(Boolean);

    // Explicit payload to avoid any extra fields and handle empty strings
    const updatePayload = {
      name: therapistForm.name,
      city: therapistForm.city,
      state: therapistForm.state,
      postal_code: therapistForm.postal_code,
      specialties: specs,
      selo_approved: therapistForm.selo_approved,
      gender: therapistForm.gender,
      avatar_url: therapistForm.avatar_url?.trim() || null,
      rating: therapistForm.rating ? parseFloat(therapistForm.rating) : null,
      contact_whatsapp: therapistForm.contact_whatsapp?.trim() || null
    };

    const { error } = await supabase
      .from('therapists')
      .update(updatePayload)
      .eq('id', editingTherapist.id);

    setLoading(false);
    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
    } else {
      toast.success('Terapeuta atualizado!');
      await loadData();
      setTherapistEditDialogOpen(false);
      setEditingTherapist(null);
      setTherapistForm({ name: '', city: '', state: '', postal_code: '', specialties: '', selo_approved: false, gender: 'female', avatar_url: '', rating: '', contact_whatsapp: '' });
    }
  }

  function openEditEventDialog(event: AppEvent) {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      date: event.date || '',
      type: event.type || 'online',
      featured: event.featured || false,
      external_url: event.external_url || '',
      image_url: event.image_url || '',
      description: event.description || '',
      category: event.category || '',
      location: event.location || ''
    });
    setEventEditDialogOpen(true);
  }

  async function updateEvent() {
    if (!editingEvent) return;
    setLoading(true);

    const updatePayload = {
      title: eventForm.title,
      date: eventForm.date,
      type: eventForm.type,
      featured: eventForm.featured,
      external_url: eventForm.external_url?.trim() || null,
      image_url: eventForm.image_url?.trim() || null,
      description: eventForm.description,
      category: eventForm.category,
      location: eventForm.location
    };

    const { error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', editingEvent.id);

    setLoading(false);
    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
    } else {
      toast.success('Evento atualizado!');
      await loadData();
      setEventEditDialogOpen(false);
      setEditingEvent(null);
      setEventForm({ title: '', date: '', type: 'online', featured: false, external_url: '', image_url: '', description: '', category: '', location: '' });
    }
  }

  async function saveAppearance() {
    setSavingAppearance(true);
    try {
      await updateSettings(appearanceForm);
      toast.success('Configurações atualizadas!', { description: 'As alterações foram salvas globalmente.' });
    } catch (error: any) {
      const isRLS = typeof error.message === 'string' && 
                    (error.message.includes('row-level security') || error.message.includes('policy'));
                    
      if (isRLS) {
        toast.error('Erro de Permissão no Banco', { 
          description: 'A sua conta (email) é Admin na plataforma, mas a sua role na tabela "profiles" no Supabase não é "admin". Você precisa pedir para um administrador alterar sua role no banco de dados para poder editar configurações.' 
        });
      } else {
        toast.error('Erro ao salvar as configurações', { description: error.message });
      }
    } finally {
      setSavingAppearance(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Button onClick={loadData} variant="outline" size="sm">Atualizar</Button>
      </div>

      {managingContentCourse ? (
        <CourseContentManager
          course={managingContentCourse}
          onBack={() => {
            setManagingContentCourse(null);
            loadData();
          }}
        />
      ) : (
        <Tabs defaultValue="courses" className="w-full">
          <TabsList>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="therapists">Terapeutas</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* APPEARANCE TAB */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
              <div>
                 <h2 className="text-xl font-bold">Personalização do App</h2>
                 <p className="text-muted-foreground text-sm mt-1">Configure cores, textos principais e logotipo. Você precisa de privilégio de Admin no banco de dados para salvar.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm">
                  Ver Site Ao Vivo
                </Button>
                <Button onClick={saveAppearance} disabled={savingAppearance} className="gradient-primary">
                  {savingAppearance && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card>
                 <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Identidade</h3>
                    <div className="space-y-2">
                      <Label>Nome do Aplicativo</Label>
                      <Input value={appearanceForm.appName} onChange={e => setAppearanceForm({ ...appearanceForm, appName: e.target.value })} />
                    </div>
                    <ImageUpload
                      label="Logotipo (Opcional, substitui o ícone do Cérebro)"
                      value={appearanceForm.logoUrl || ''}
                      onChange={(url) => setAppearanceForm({ ...appearanceForm, logoUrl: url })}
                      folder="settings"
                    />
                 </CardContent>
               </Card>

               <Card>
                 <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Hero Section (Landing Page)</h3>
                    <div className="space-y-2">
                      <Label>Título Principal</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={appearanceForm.heroTitle}
                        onChange={e => setAppearanceForm({ ...appearanceForm, heroTitle: e.target.value })}
                        placeholder="Ex: Onde o Conhecimento\nTransforma Vidas."
                      />
                      <p className="text-xs text-muted-foreground">Você pode usar Enter para quebrar a linha.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={appearanceForm.heroSubtitle}
                        onChange={e => setAppearanceForm({ ...appearanceForm, heroSubtitle: e.target.value })}
                      />
                    </div>
                 </CardContent>
               </Card>

               <Card>
                 <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Banner do Dashboard (App)</h3>
                    <div className="space-y-2">
                      <Label>Título (Plataforma Interna)</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={appearanceForm.dashboardTitle}
                        onChange={e => setAppearanceForm({ ...appearanceForm, dashboardTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo (Plataforma Interna)</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={appearanceForm.dashboardSubtitle}
                        onChange={e => setAppearanceForm({ ...appearanceForm, dashboardSubtitle: e.target.value })}
                      />
                    </div>
                 </CardContent>
               </Card>

               <Card className="col-span-1 md:col-span-2">
                 <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Cores Globais do App</h3>
                    <p className="text-sm text-foreground/80 mb-4">Essas cores dominam 100% de todo o seu aplicativo, barras e botões. Selecione visualmente.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ColorField label="Cor Primária" hslValue={appearanceForm.primaryColor} onChange={c => setAppearanceForm({...appearanceForm, primaryColor: c})} />
                      <ColorField label="Cor Secundária" hslValue={appearanceForm.secondaryColor} onChange={c => setAppearanceForm({...appearanceForm, secondaryColor: c})} />
                      <ColorField label="Cor de Destaque" hslValue={appearanceForm.accentColor} onChange={c => setAppearanceForm({...appearanceForm, accentColor: c})} />
                      
                      <ColorField label="Fundo do App (Geral)" hslValue={appearanceForm.appBackground || "0 0% 97%"} onChange={c => setAppearanceForm({...appearanceForm, appBackground: c})} />
                      <ColorField label="Fundo dos Menus (Barras)" hslValue={appearanceForm.sidebarBackground || appearanceForm.primaryColor} onChange={c => setAppearanceForm({...appearanceForm, sidebarBackground: c})} />
                      <ColorField label="Texto dos Menus (Barras)" hslValue={appearanceForm.sidebarText || "0 0% 100%"} onChange={c => setAppearanceForm({...appearanceForm, sidebarText: c})} />
                    </div>
                 </CardContent>
               </Card>
               <Card className="col-span-1 md:col-span-2">
                 <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Cores dos Eventos</h3>
                    <p className="text-sm text-foreground/80 mb-4">Personalize as cores específicas dos cards de eventos.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ColorField label="Botão de Inscrição" hslValue={appearanceForm.eventButtonColor || appearanceForm.primaryColor} onChange={c => setAppearanceForm({...appearanceForm, eventButtonColor: c})} />
                      <ColorField label="Badge Evento Online" hslValue={appearanceForm.eventBadgeOnlineColor || "210 100% 50%"} onChange={c => setAppearanceForm({...appearanceForm, eventBadgeOnlineColor: c})} />
                      <ColorField label="Badge Evento Presencial" hslValue={appearanceForm.eventBadgePresencialColor || "210 40% 96%"} onChange={c => setAppearanceForm({...appearanceForm, eventBadgePresencialColor: c})} />
                    </div>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gerenciar Cursos</h2>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Novo Curso</Button></DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Novo Curso</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Título</Label><Input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Instrutor</Label><Input value={courseForm.instructor} onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Duração</Label><Input value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} /></div>
                    <ImageUpload
                      label="Imagem de Capa"
                      value={courseForm.image_url}
                      onChange={(url) => setCourseForm({ ...courseForm, image_url: url })}
                      folder="courses"
                    />
                    <div className="space-y-2"><Label>Link Vimeo</Label>
                      <Input
                        value={courseForm.video_url}
                        placeholder="https://vimeo.com/... ou código <iframe>"
                        onChange={e => {
                          const val = e.target.value;
                          const vimeoMatch = val.match(/https?:\/\/player\.vimeo\.com\/video\/[^\s"'<>]+/i);
                          const ytMatch = val.match(/https?:\/\/(?:www\.)?youtube\.com\/embed\/[^\s"'<>]+/i);

                          let extractedUrl = null;
                          if (vimeoMatch) extractedUrl = vimeoMatch[0].replace(/&amp;/g, '&');
                          else if (ytMatch) extractedUrl = ytMatch[0].replace(/&amp;/g, '&');

                          if (extractedUrl) {
                            setCourseForm({ ...courseForm, video_url: extractedUrl });
                          } else {
                            setCourseForm({ ...courseForm, video_url: val });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2"><Label>Link Inscrição Externa</Label><Input value={courseForm.external_url} onChange={e => setCourseForm({ ...courseForm, external_url: e.target.value })} placeholder="https://..." /></div>
                    <div className="space-y-2"><Label>Descrição</Label><Input value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Selo/Badge (ex: Novo, Popular)</Label><Input value={courseForm.badge} onChange={e => setCourseForm({ ...courseForm, badge: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>O que você vai aprender (separado por vírgula)</Label>
                      <Input
                        value={courseForm.learning_outcomes}
                        onChange={e => setCourseForm({ ...courseForm, learning_outcomes: e.target.value })}
                        placeholder="Ex: Introdução, Prática Avançada, etc"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                       <input type="checkbox" id="is_premium_new" checked={courseForm.is_premium} onChange={e => setCourseForm({...courseForm, is_premium: e.target.checked})} />
                       <Label htmlFor="is_premium_new">Curso Premium (Apenas Assinantes)</Label>
                    </div>
                    <Button onClick={createCourse} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Instrutor</TableHead><TableHead>Status</TableHead><TableHead className="w-[150px]">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {courses.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.instructor}</TableCell>
                      <TableCell>{c.published ? 'Publicado' : 'Rascunho'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(c)}
                            title="Editar Curso"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingContentCourse(c)}
                            title="Gerenciar Conteúdo"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem('courses', c.id)} className="text-destructive hover:text-destructive/90">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Edit Course Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2"><Label>Título</Label><Input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Instrutor</Label><Input value={courseForm.instructor} onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Duração</Label><Input value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} /></div>
                  <ImageUpload
                    label="Imagem de Capa"
                    value={courseForm.image_url}
                    onChange={(url) => setCourseForm({ ...courseForm, image_url: url })}
                    folder="courses"
                  />
                  <div className="space-y-2"><Label>Link Vídeo (YouTube/Vimeo)</Label>
                    <Input
                      value={courseForm.video_url}
                      placeholder="https://vimeo.com/... ou código <iframe>"
                      onChange={e => {
                        const val = e.target.value;
                        const vimeoMatch = val.match(/https?:\/\/player\.vimeo\.com\/video\/[^\s"'<>]+/i);
                        const ytMatch = val.match(/https?:\/\/(?:www\.)?youtube\.com\/embed\/[^\s"'<>]+/i);

                        let extractedUrl = null;
                        if (vimeoMatch) extractedUrl = vimeoMatch[0].replace(/&amp;/g, '&');
                        else if (ytMatch) extractedUrl = ytMatch[0].replace(/&amp;/g, '&');

                        if (extractedUrl) {
                          setCourseForm({ ...courseForm, video_url: extractedUrl });
                        } else {
                          setCourseForm({ ...courseForm, video_url: val });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2"><Label>Link Inscrição Externa</Label><Input value={courseForm.external_url} onChange={e => setCourseForm({ ...courseForm, external_url: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-2"><Label>Descrição</Label><Input value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Selo/Badge (ex: Novo, Popular)</Label><Input value={courseForm.badge} onChange={e => setCourseForm({ ...courseForm, badge: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>O que você vai aprender (separado por vírgula)</Label>
                    <Input
                      value={courseForm.learning_outcomes}
                      onChange={e => setCourseForm({ ...courseForm, learning_outcomes: e.target.value })}
                      placeholder="Ex: Introdução, Prática Avançada, etc"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                     <input type="checkbox" id="is_premium_edit" checked={courseForm.is_premium} onChange={e => setCourseForm({...courseForm, is_premium: e.target.checked})} />
                     <Label htmlFor="is_premium_edit">Curso Premium (Apenas Assinantes)</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateCourse} className="flex-1" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* THERAPISTS TAB */}
          <TabsContent value="therapists" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gerenciar Terapeutas</h2>
              <Dialog>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Novo Terapeuta</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Terapeuta</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={therapistForm.name} onChange={e => setTherapistForm({ ...therapistForm, name: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Gênero</Label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={therapistForm.gender}
                        onChange={e => setTherapistForm({ ...therapistForm, gender: e.target.value })}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                      </select>
                    </div>
                    <div className="space-y-2"><Label>Cidade</Label><Input value={therapistForm.city} onChange={e => setTherapistForm({ ...therapistForm, city: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Estado</Label><Input value={therapistForm.state} onChange={e => setTherapistForm({ ...therapistForm, state: e.target.value })} /></div>
                    <div className="space-y-2"><Label>CEP</Label><Input value={therapistForm.postal_code} onChange={e => setTherapistForm({ ...therapistForm, postal_code: e.target.value })} placeholder="Ex: 95670-000" /></div>
                    <div className="space-y-2"><Label>Especialidades (virgula)</Label><Input value={therapistForm.specialties} onChange={e => setTherapistForm({ ...therapistForm, specialties: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Avaliação (0-5)</Label><Input value={therapistForm.rating} onChange={e => setTherapistForm({ ...therapistForm, rating: e.target.value })} placeholder="Ex: 4.8" /></div>
                    <div className="space-y-2"><Label>WhatsApp (Ex: 5511999999999)</Label><Input value={therapistForm.contact_whatsapp} onChange={e => setTherapistForm({ ...therapistForm, contact_whatsapp: e.target.value })} /></div>
                    <ImageUpload
                      label="Foto do Terapeuta"
                      value={therapistForm.avatar_url}
                      onChange={(url) => setTherapistForm({ ...therapistForm, avatar_url: url })}
                      folder="therapists"
                    />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={therapistForm.selo_approved} onChange={e => setTherapistForm({ ...therapistForm, selo_approved: e.target.checked })} />
                      <Label>Selo de Aprovação</Label>
                    </div>
                    <Button onClick={createTherapist} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {therapists.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.city} - {t.state}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTherapistDialog(t)}
                            title="Editar Terapeuta"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem('therapists', t.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Edit Therapist Dialog */}
            <Dialog open={therapistEditDialogOpen} onOpenChange={setTherapistEditDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Terapeuta</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2"><Label>Nome</Label><Input value={therapistForm.name} onChange={e => setTherapistForm({ ...therapistForm, name: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={therapistForm.gender}
                      onChange={e => setTherapistForm({ ...therapistForm, gender: e.target.value })}
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Cidade</Label><Input value={therapistForm.city} onChange={e => setTherapistForm({ ...therapistForm, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Estado</Label><Input value={therapistForm.state} onChange={e => setTherapistForm({ ...therapistForm, state: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CEP</Label><Input value={therapistForm.postal_code} onChange={e => setTherapistForm({ ...therapistForm, postal_code: e.target.value })} placeholder="Ex: 95670-000" /></div>
                  <div className="space-y-2"><Label>Especialidades (separadas por vírgula)</Label><Input value={therapistForm.specialties} onChange={e => setTherapistForm({ ...therapistForm, specialties: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Avaliação (0-5)</Label><Input value={therapistForm.rating} onChange={e => setTherapistForm({ ...therapistForm, rating: e.target.value })} placeholder="Ex: 4.8" /></div>
                  <div className="space-y-2"><Label>WhatsApp (Ex: 5511999999999)</Label><Input value={therapistForm.contact_whatsapp} onChange={e => setTherapistForm({ ...therapistForm, contact_whatsapp: e.target.value })} /></div>
                  <ImageUpload
                    label="Foto do Terapeuta"
                    value={therapistForm.avatar_url}
                    onChange={(url) => setTherapistForm({ ...therapistForm, avatar_url: url })}
                    folder="therapists"
                  />
                  {therapistForm.avatar_url && (
                    <p className="text-[10px] text-muted-foreground break-all bg-muted p-1 rounded">
                      Link: {therapistForm.avatar_url}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={therapistForm.selo_approved} onChange={e => setTherapistForm({ ...therapistForm, selo_approved: e.target.checked })} />
                    <Label>Selo de Aprovação</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateTherapist} className="flex-1" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setTherapistEditDialogOpen(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gerenciar Eventos</h2>
              <Dialog>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Novo Evento</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Título</Label><Input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Data</Label><Input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Tipo</Label><Input value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} placeholder="online ou presencial" /></div>
                    <div className="space-y-2"><Label>Localização</Label><Input value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Ex: São Paulo, SP ou Zoom" /></div>
                    <div className="space-y-2"><Label>Categoria</Label><Input value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })} placeholder="Ex: Workshop, Mentoria" /></div>
                    <ImageUpload
                      label="Imagem do Evento"
                      value={eventForm.image_url}
                      onChange={(url) => setEventForm({ ...eventForm, image_url: url })}
                      folder="events"
                    />
                    <div className="space-y-2"><Label>Descrição</Label><Input value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Link Externo (Eventbrite, etc)</Label><Input value={eventForm.external_url} onChange={e => setEventForm({ ...eventForm, external_url: e.target.value })} placeholder="https://..." /></div>
                    <Button onClick={createEvent} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Evento</TableHead><TableHead>Tipo</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {events.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.title}</TableCell>
                      <TableCell>{e.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditEventDialog(e)}
                            title="Editar Evento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem('events', e.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Edit Event Dialog */}
            <Dialog open={eventEditDialogOpen} onOpenChange={setEventEditDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Evento</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2"><Label>Título</Label><Input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Tipo</Label><Input value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Localização</Label><Input value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Categoria</Label><Input value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })} /></div>
                  <ImageUpload
                    label="Imagem do Evento"
                    value={eventForm.image_url}
                    onChange={(url) => setEventForm({ ...eventForm, image_url: url })}
                    folder="events"
                  />
                  <div className="space-y-2"><Label>Descrição</Label><Input value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Link Externo</Label><Input value={eventForm.external_url} onChange={e => setEventForm({ ...eventForm, external_url: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button onClick={updateEvent} className="flex-1" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setEventEditDialogOpen(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* MATERIALS TAB */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gerenciar Materiais de Apoio</h2>
              <Dialog>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Novo Material</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Título</Label><Input value={materialForm.title} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} /></div>
                    <ImageUpload
                      label="Imagem do Material"
                      value={materialForm.image_url}
                      onChange={(url) => setMaterialForm({ ...materialForm, image_url: url })}
                      folder="materials"
                    />
                    <div className="space-y-2"><Label>Link de Compra</Label><Input value={materialForm.external_url} onChange={e => setMaterialForm({ ...materialForm, external_url: e.target.value })} placeholder="https://..." /></div>
                    <div className="space-y-2"><Label>Preço (ex: R$ 49,90)</Label><Input value={materialForm.price} onChange={e => setMaterialForm({ ...materialForm, price: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Categoria</Label><Input value={materialForm.category} onChange={e => setMaterialForm({ ...materialForm, category: e.target.value })} placeholder="Livros, Ferramentas, etc" /></div>
                    <div className="space-y-2"><Label>Descrição</Label><Input value={materialForm.description} onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })} /></div>
                    <Button onClick={createMaterial} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {materials.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{m.title}</TableCell>
                      <TableCell>{m.category}</TableCell>
                      <TableCell>{m.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMaterialDialog(m)}
                            title="Editar Material"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem('materials', m.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Edit Material Dialog */}
            <Dialog open={materialEditDialogOpen} onOpenChange={setMaterialEditDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Material</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2"><Label>Título</Label><Input value={materialForm.title} onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })} /></div>
                  <ImageUpload
                    label="Imagem do Material"
                    value={materialForm.image_url}
                    onChange={(url) => setMaterialForm({ ...materialForm, image_url: url })}
                    folder="materials"
                  />
                  <div className="space-y-2"><Label>Link de Compra</Label><Input value={materialForm.external_url} onChange={e => setMaterialForm({ ...materialForm, external_url: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-2"><Label>Preço (ex: R$ 49,90)</Label><Input value={materialForm.price} onChange={e => setMaterialForm({ ...materialForm, price: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Categoria</Label><Input value={materialForm.category} onChange={e => setMaterialForm({ ...materialForm, category: e.target.value })} placeholder="Livros, Ferramentas, etc" /></div>
                  <div className="space-y-2"><Label>Descrição</Label><Input value={materialForm.description} onChange={e => setMaterialForm({ ...materialForm, description: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button onClick={updateMaterial} className="flex-1" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setMaterialEditDialogOpen(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}


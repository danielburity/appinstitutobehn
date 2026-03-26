import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { EventCard } from "@/components/features/EventCard";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppEvent } from "@/lib/types";
import { toast } from "sonner";

const Events = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    data: "",
    hora: "",
    local: "",
    tipo: "online",
    categoria: "",
    descricao: "",
    imagem: "",
    destaque: false,
  });
  const { isAdmin } = useAuth();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
      if (data) setEvents(data as AppEvent[]);
    }
    load();
  }, []);

  const filtros = ["Todos", "Próximos", "Este Mês", "Online", "Presencial"];

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = date ?? today;
    const sameMonth = (d: Date) => d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();

    let list = events;

    if (filtroAtivo === "Online") list = list.filter((e) => e.type.toLowerCase() === "online");
    if (filtroAtivo === "Presencial") list = list.filter((e) => e.type.toLowerCase() === "presencial");
    if (filtroAtivo === "Próximos") {
      list = list.filter((e) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate >= today;
      });
    }
    if (filtroAtivo === "Este Mês") {
      list = list.filter((e) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return sameMonth(eventDate);
      });
    }

    return list;
  }, [filtroAtivo, date, events]);

  const eventosDestaque = filteredEvents.filter((e) => e.featured);
  const outrosEventos = filteredEvents.filter((e) => !e.featured);

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Eventos</h1>
        <p className="text-muted-foreground">
          Participe de workshops, congressos e webinars sobre Hipnose e PNL
        </p>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">Cadastrar Evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data (YYYY-MM-DD)</Label>
                  <Input id="data" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora (HH:MM)</Label>
                  <Input id="hora" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input id="local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo (online/presencial)</Label>
                  <Input id="tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input id="categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="imagem">Imagem (URL)</Label>
                  <Input id="imagem" value={form.imagem} onChange={(e) => setForm({ ...form, imagem: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="external_url">Link Externo (Eventbrite, etc)</Label>
                  <Input id="external_url" value={(form as any).external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value } as any)} />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input id="destaque" type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} />
                  <Label htmlFor="destaque">Destaque</Label>
                </div>
              </div>
              <Button
                onClick={async () => {
                  const { error } = await supabase.from("events").insert({
                    title: form.titulo,
                    date: form.data,
                    time: form.hora,
                    location: form.local,
                    type: form.tipo,
                    category: form.categoria,
                    description: form.descricao,
                    image_url: form.imagem,
                    external_url: (form as any).external_url || null,
                    featured: form.destaque,
                  });
                  if (!error) {
                    toast.success("Evento cadastrado com sucesso!");
                    const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
                    setEvents(data as AppEvent[]);
                    setOpen(false);
                    setForm({ titulo: "", data: "", hora: "", local: "", tipo: "online", categoria: "", descricao: "", imagem: "", destaque: false });
                  } else {
                    toast.error("Erro ao cadastrar evento: " + error.message);
                  }
                }}
              >
                Salvar
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 border border-border sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-accent" />
              <h2 className="font-bold text-lg text-foreground">Calendário</h2>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-sm text-muted-foreground">Eventos marcados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Eventos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => (
              <Badge
                key={filtro}
                variant={filtroAtivo === filtro ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${filtroAtivo === filtro
                  ? "bg-accent hover:bg-accent/90"
                  : "hover:bg-muted"
                  }`}
                onClick={() => setFiltroAtivo(filtro)}
              >
                {filtro}
              </Badge>
            ))}
          </div>

          {/* Eventos em Destaque */}
          {eventosDestaque.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Eventos em Destaque
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventosDestaque.map((evento) => (
                  <EventCard key={evento.id} event={evento} variant="featured" />
                ))}
              </div>
            </div>
          )}

          {/* Todos os Eventos */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Todos os Eventos
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {outrosEventos.map((evento) => (
                <EventCard key={evento.id} event={evento} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;

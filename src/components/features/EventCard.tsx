import { Calendar, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppEvent } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventCardProps {
  event: AppEvent;
  variant?: 'default' | 'featured';
}

export const EventCard = ({ event, variant = 'default' }: EventCardProps) => {
  const isValidDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime());
  };

  const dataFormatada = event.date && isValidDate(event.date)
    ? format(new Date(event.date), "dd 'de' MMM yyyy", { locale: ptBR })
    : "Data a definir";

  if (variant === 'featured') {
    return (
      <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-smooth border border-border">
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image_url || "https://images.unsplash.com/photo-1544367563-12123d8959bd?auto=format&fit=crop&q=80"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <Badge 
            className={`absolute top-3 right-3 text-primary-foreground border-none`}
            style={{ backgroundColor: event.type?.toLowerCase() === 'online' ? 'hsl(var(--event-badge-online))' : 'hsl(var(--event-badge-presencial))' }}
          >
            {event.type?.toLowerCase() === 'online' ? 'Online' : 'Presencial'}
          </Badge>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{dataFormatada}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{event.time}</span>
          </div>

          <h3 className="font-bold text-xl text-foreground">{event.title}</h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

          <Button
            className="w-full text-white hover:opacity-90 border-none"
            style={{ backgroundColor: 'hsl(var(--event-button))' }}
            onClick={() => event.external_url ? window.open(event.external_url, '_blank') : null}
          >
            {event.external_url ? 'Inscrição Externa' : 'Inscrever-se'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-md hover:shadow-xl transition-smooth border border-border flex gap-4">
      <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 min-w-[80px]">
        <span className="text-2xl font-bold text-primary">
          {event.date && isValidDate(event.date) ? format(new Date(event.date), "dd", { locale: ptBR }) : "--"}
        </span>
        <span className="text-sm text-muted-foreground uppercase">
          {event.date && isValidDate(event.date) ? format(new Date(event.date), "MMM", { locale: ptBR }) : "---"}
        </span>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="text-xs text-primary-foreground border-none"
            style={{ backgroundColor: event.type?.toLowerCase() === 'online' ? 'hsl(var(--event-badge-online))' : 'hsl(var(--event-badge-presencial))' }}
          >
            {event.type?.toLowerCase() === 'online' ? 'Online' : 'Presencial'}
          </Badge>
          <span className="text-xs text-muted-foreground">{event.category}</span>
        </div>

        <h3 className="font-bold text-foreground">{event.title}</h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => event.external_url ? window.open(event.external_url, '_blank') : null}
        >
          {event.external_url ? 'Link Externo' : 'Saiba Mais'}
        </Button>
      </div>
    </div>
  );
};

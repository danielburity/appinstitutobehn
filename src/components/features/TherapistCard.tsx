import { MessageCircle, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Therapist } from "@/lib/types";

interface TherapistCardProps {
  therapist: Therapist;
}

export const TherapistCard = ({ therapist }: TherapistCardProps) => {
  // Generate a fallback avatar if needed, ensuring it looks nice
  const avatarUrl = therapist.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${therapist.id}&mouth=smile&eyebrows=default`;

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-smooth border border-border">
      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={avatarUrl}
          alt={therapist.name}
          className="w-20 h-20 rounded-full object-cover flex-shrink-0 mx-auto sm:mx-0"
        />

        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <h3 className="font-bold text-lg text-foreground text-center sm:text-left">{therapist.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 justify-center sm:justify-start">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{therapist.city} - {therapist.state}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {therapist.specialties?.map((esp, index) => (
              <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap">
                {esp}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">{therapist.rating?.toFixed(1) || "5.0"}</span>
            </div>

            <Button
              size="sm"
              className="gap-2 bg-accent hover:bg-accent/90 w-full sm:w-auto text-sm"
              onClick={() => {
                // Formatting WhatsApp number - removing non-digits
                const phone = therapist.contact_whatsapp?.replace(/\D/g, '');
                if (phone) {
                  window.open(`https://wa.me/${phone}?text=Olá, gostaria de agendar uma consulta.`, '_blank');
                } else {
                  alert("Contato não disponível");
                }
              }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="whitespace-nowrap">Entrar em Contato</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

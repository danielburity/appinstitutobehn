import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TherapistCard } from "@/components/features/TherapistCard";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Therapist } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";

const Therapists = () => {
  const [estado, setEstado] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [query, setQuery] = useState("");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(false);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  // Photo edit state
  const { profile, isAdmin, refreshProfile } = useAuth();
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);

  async function loadTherapists() {
    setLoading(true);
    const { data, error } = await supabase
      .from("therapists")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      setTherapists(data as Therapist[]);

      // Extract unique states and specialties for filters
      const states = Array.from(new Set(data.map(t => t.state).filter(Boolean))) as string[];
      setAvailableStates(states.sort());

      const specs = new Set<string>();
      data.forEach(t => {
        t.specialties?.forEach((s: string) => specs.add(s));
      });
      setAvailableSpecialties(Array.from(specs).sort());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTherapists();
  }, []);

  const filteredData = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase();

    return therapists
      .filter((t) => (estado && estado !== "all" ? t.state === estado : true))
      .filter((t) => (especialidade && especialidade !== "all" ? t.specialties?.some((s: string) => s === especialidade) : true))
      .filter(
        (t) => {
          if (!query) return true;
          const search = normalize(query);
          return (
            normalize(t.name).includes(search) ||
            normalize(t.city || "").includes(search) ||
            (t.postal_code && normalize(t.postal_code).includes(search))
          );
        }
      );
  }, [estado, especialidade, query, therapists]);

  // Check if a therapist belongs to the current user
  const isOwnTherapist = (t: Therapist) => {
    if (!profile?.full_name) return false;
    return t.name.toLowerCase().trim() === profile.full_name.toLowerCase().trim();
  };

  // Can edit: own profile OR admin
  const canEditPhoto = (t: Therapist) => {
    return isOwnTherapist(t) || isAdmin;
  };

  const handleOpenPhotoEdit = (t: Therapist) => {
    setEditingTherapist(t);
    setNewAvatarUrl(t.avatar_url || "");
  };

  const handleSavePhoto = async () => {
    if (!editingTherapist) return;
    setSavingPhoto(true);

    try {
      // 1. Update the therapists table
      const { error: therapistErr } = await supabase
        .from("therapists")
        .update({ avatar_url: newAvatarUrl?.trim() || null })
        .eq("id", editingTherapist.id);

      if (therapistErr) throw therapistErr;

      // 2. If it's the current user's own profile, update profiles too
      if (isOwnTherapist(editingTherapist) && profile) {
        await supabase
          .from("profiles")
          .update({ avatar_url: newAvatarUrl?.trim() || null })
          .eq("id", profile.id);
        await refreshProfile();
      }

      // 3. If admin is editing someone else, try to find and update their profile by name
      if (isAdmin && !isOwnTherapist(editingTherapist)) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", editingTherapist.name)
          .limit(1);

        if (matchedProfiles && matchedProfiles.length > 0) {
          await supabase
            .from("profiles")
            .update({ avatar_url: newAvatarUrl?.trim() || null })
            .eq("id", matchedProfiles[0].id);
        }
      }

      toast.success("Foto atualizada com sucesso!");
      setEditingTherapist(null);
      await loadTherapists();
    } catch (err: any) {
      console.error("[Therapists] Erro ao salvar foto:", err);
      toast.error("Erro ao salvar foto: " + (err.message || "Tente novamente"));
    } finally {
      setSavingPhoto(false);
    }
  };

  const therapistCards = useMemo(() => {
    return filteredData.map((t) => (
      <TherapistCard
        key={t.id}
        therapist={t}
        isOwnProfile={canEditPhoto(t)}
        onEditPhoto={() => handleOpenPhotoEdit(t)}
      />
    ));
  }, [filteredData, profile, isAdmin]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Encontre um Terapeuta
        </h1>
        <p className="text-muted-foreground">
          Conecte-se com profissionais certificados em Hipnose e PNL
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-4">
        <h2 className="font-bold text-lg text-foreground">Buscar Terapeutas</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="CEP ou Cidade"
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {availableStates.map((est) => (
                <SelectItem key={est} value={est}>
                  {est}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={especialidade} onValueChange={setEspecialidade}>
            <SelectTrigger>
              <SelectValue placeholder="Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Especialidades</SelectItem>
              {availableSpecialties.map((esp) => (
                <SelectItem key={esp} value={esp}>
                  {esp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full sm:w-auto gradient-primary text-white hover:opacity-90">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Resultados */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">
          {filteredData.length} {filteredData.length === 1 ? 'Terapeuta Encontrado' : 'Terapeutas Encontrados'}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <p>Carregando terapeutas...</p>
          ) : (
            therapistCards
          )}
        </div>
      </div>

      {/* ─── Dialog de edição de foto ─── */}
      <Dialog open={!!editingTherapist} onOpenChange={(open) => !open && setEditingTherapist(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Alterar Foto — {editingTherapist?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <ImageUpload
              label="Nova Foto de Perfil"
              value={newAvatarUrl}
              onChange={setNewAvatarUrl}
              folder="avatars"
              bucket="avatars"
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingTherapist(null)}
                disabled={savingPhoto}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gradient-primary text-white font-bold"
                onClick={handleSavePhoto}
                disabled={savingPhoto}
              >
                {savingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {savingPhoto ? "Salvando..." : "Salvar Foto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Therapists;

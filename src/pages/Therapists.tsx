import { useEffect, useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TherapistCard } from "@/components/features/TherapistCard";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Therapist } from "@/lib/types";

const Therapists = () => {
  const [estado, setEstado] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [query, setQuery] = useState("");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(false);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
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
    load();
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

  const therapistCards = useMemo(() => {
    return filteredData.map((t) => <TherapistCard key={t.id} therapist={t} />);
  }, [filteredData]);

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
    </div>
  );
};

export default Therapists;

import { useEffect, useState } from "react";
import { Package, ShoppingCart, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Material } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Materials = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMaterials() {
            const { data, error } = await supabase
                .from("materials")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) setMaterials(data);
            setLoading(false);
        }
        loadMaterials();
    }, []);

    return (
        <div className="space-y-8 pb-20 md:pb-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Package className="w-8 h-8 text-accent" />
                    Materiais de Apoio
                </h1>
                <p className="text-muted-foreground">
                    Encontre produtos, livros e ferramentas para potencializar seu aprendizado.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[400px] bg-card/50 animate-pulse rounded-2xl border border-border" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 flex flex-col"
                        >
                            {/* Image Container */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={item.image_url || "/placeholder-material.jpg"}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-0">
                                        {item.category || "Geral"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl text-foreground line-clamp-1">{item.title}</h3>
                                </div>

                                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                                    {item.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Investimento</span>
                                        <span className="text-lg font-bold text-accent">{item.price || "Consulte"}</span>
                                    </div>

                                    <Button
                                        asChild
                                        className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl px-6"
                                    >
                                        <a
                                            href={item.external_url || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Comprar
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && materials.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground">Nenhum material encontrado</h3>
                    <p className="text-muted-foreground text-sm">Em breve teremos novidades por aqui!</p>
                </div>
            )}
        </div>
    );
};

export default Materials;

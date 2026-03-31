import { useState, useEffect } from "react";
import { X, Play, FileText, Star, CheckCircle } from "lucide-react";

export const WelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the welcome popup
    const hidePopup = localStorage.getItem("hideCourseWelcome");
    if (!hidePopup) {
      // Delay showing it slightly for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("hideCourseWelcome", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 relative animate-in zoom-in-95 duration-500">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-4 text-foreground pr-6">Primeira vez aqui no curso?</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
               <Play className="w-4 h-4" />
             </div>
             <p className="text-sm text-foreground/90">
                Selecione a aula e dê <strong>play no vídeo</strong> ou baixe os materiais em anexo clicando neles.
             </p>
          </div>
          
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
               <Star className="w-4 h-4" />
             </div>
             <p className="text-sm text-foreground/90">
                Lembre-se de avaliar a aula clicando nas estrelas. Isto nos ajuda a melhorar!
             </p>
          </div>

          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
               <CheckCircle className="w-4 h-4" />
             </div>
             <p className="text-sm text-foreground/90">
                Assim que finalizar, clique em <strong>"MARCAR COMO CONCLUÍDA"</strong> para contabilizar o seu progresso total.
             </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-xl transition-transform active:scale-95"
        >
          Entendi o funcionamento
        </button>
      </div>
    </div>
  );
};

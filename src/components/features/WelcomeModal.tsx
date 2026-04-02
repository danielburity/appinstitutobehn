import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, Map, UserCircle, Users, Calendar, Sparkles } from "lucide-react";

export const WelcomeModal = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [neverShowAgain, setNeverShowAgain] = useState(false);

    useEffect(() => {
        if (!user) return;

        const storageKey = `welcome_views_${user.id}`;
        const viewsCount = parseInt(localStorage.getItem(storageKey) || "0", 10);

        if (viewsCount < 5) {
            // Show the modal
            const timer = setTimeout(() => setIsOpen(true), 1500); // delay opening slightly for a smoother UX
            
            // Only insert the notification if it's the very first time they see it (viewsCount === 0)
            if (viewsCount === 0) {
                createWelcomeNotification(user.id);
            }

            return () => clearTimeout(timer);
        }
    }, [user]);

    const createWelcomeNotification = async (userId: string) => {
        try {
            // Check if a welcome notification already exists to avoid duplicates
            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userId)
                .ilike('title', '%Bem-vindo ao APP Instituto%')
                .maybeSingle();

            if (!existing) {
                const welcomeText = `Seja bem-vindo ao APP Instituto Behn!

Para navegar, você pode:
• Acessar o menu com 3 riscos no mobile, na barra de ícones na parte inferior do APP ou na web na barra lateral com todos os acessos.
• Para acessar um curso vá até CURSOS, escolha o curso e vá do ínicio (que é o que recomendamos). Bons estudos!
• Você também pode alterar seu nome de exibição no app indo até o ícone no canto superior direito, lá você poderá alterar sua foto, nome e mudar sua senha.
• Você imediatamente será cadastrado como nosso Terapeuta Behn; vá até o painel e visualize o seu contato.
• Em breve, nossos eventos estarão disponíveis também aqui no APP, você pode ver como ficam indo até o menu na opção EVENTOS.

Se ainda restar alguma dúvida, basta enviar uma mensagem clicando no ícone de chat no canto inferior direito.`;

                await supabase.from('notifications').insert({
                    user_id: userId,
                    title: '🎉 Seja Bem-vindo ao APP Instituto Behn!',
                    content: welcomeText,
                    read: false
                });
            }
        } catch (err) {
            console.error('Error inserting welcome notification', err);
        }
    }

    const handleClose = () => {
        if (!user) return;
        const storageKey = `welcome_views_${user.id}`;
        
        if (neverShowAgain) {
            localStorage.setItem(storageKey, "5");
        } else {
            const currentViews = parseInt(localStorage.getItem(storageKey) || "0", 10);
            localStorage.setItem(storageKey, (currentViews + 1).toString());
        }
        
        setIsOpen(false);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header com Gradiente e Ilustração Indireta */}
                        <div className="relative gradient-primary p-6 md:p-8 text-primary-foreground flex flex-col items-center text-center">
                            <button 
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            
                            <div className="bg-white/20 p-3 rounded-full mb-4 shadow-lg backdrop-blur-md">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
                                Seja bem-vindo ao<br/>Instituto Behn!
                            </h2>
                            <p className="text-primary-foreground/90 font-medium max-w-md">
                                Sua jornada de transformação e aprendizado começa agora. Veja como aproveitar o máximo da nossa plataforma:
                            </p>
                        </div>

                        {/* Conteúdo com scroll se necessário no mobile */}
                        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                            
                            <div className="grid gap-6">
                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 bg-primary/10 p-2 rounded-lg">
                                        <Map className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">Navegação Fácil</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Acesse nossas ferramentas pelo <strong className="text-foreground">menu com 3 riscos no celular</strong>, pela barra de ícones inferior ou, no computador, pela aba lateral completa.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 bg-secondary/10 p-2 rounded-lg">
                                        <GraduationCap className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">Cursos & Aulas</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Vá na aba <strong className="text-foreground">CURSOS</strong> e escolha o seu. Recomendamos sempre seguir a trilha desde o início. Bons estudos!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 bg-accent/10 p-2 rounded-lg">
                                        <UserCircle className="w-6 h-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">Seu Perfil</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Altere seu <strong className="text-foreground">nome, foto e senha</strong> clicando no círculo com suas iniciais lá no canto superior direito da tela.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 bg-primary/10 p-2 rounded-lg gap-2">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">Rede de Terapeutas</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Você imediatamente será cadastrado como nosso Terapeuta Behn; acesse a guia Terapeutas para conferir e editar o seu próprio perfil de contato.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 bg-secondary/10 p-2 rounded-lg">
                                        <Calendar className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">Eventos em Breve</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Todos os nossos encontros estarão disponíveis presencialmente ou online no menu <strong className="text-foreground">EVENTOS</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>Dúvidas? <strong className="text-foreground font-semibold">Envie mensagem no chat</strong> no canto inferior direito.</span>
                            </div>
                        </div>

                        {/* Footer (Ações) */}
                        <div className="p-4 md:p-6 bg-muted/30 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                    checked={neverShowAgain}
                                    onChange={(e) => setNeverShowAgain(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    Não mostrar este aviso novamente
                                </span>
                            </label>

                            <button 
                                onClick={handleClose}
                                className="w-full sm:w-auto px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                            >
                                Começar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

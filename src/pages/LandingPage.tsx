
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import {
    ArrowRight,
    CheckCircle2,
    Brain,
    Sparkles,
    Target,
    ShieldCheck,
    Users,
    Calendar,
    Lock,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutForm } from "@/components/subscription/CheckoutForm";

const LandingPage = () => {
    const navigate = useNavigate();
    const { isMember, user } = useAuth();
    const { settings } = useSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (isMember) {
            navigate("/home");
        }
    }, [isMember, navigate]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/40 py-3" : "bg-transparent py-5"}`}>
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                        ) : (
                            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Brain className="text-white w-6 h-6" />
                            </div>
                        )}
                        <span className="text-xl font-black tracking-tighter text-primary">{settings.appName}</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#beneficios" className="text-sm font-semibold hover:text-primary transition-colors">Benefícios</a>
                        <a href="#cursos" className="text-sm font-semibold hover:text-primary transition-colors">Plataforma</a>
                        <a href="#precos" className="text-sm font-semibold hover:text-primary transition-colors">Assinatura</a>
                        {user ? (
                            <Button variant="outline" className="rounded-full px-6" onClick={() => navigate("/home")}>
                                Acessar Portal
                            </Button>
                        ) : (
                            <Button variant="ghost" className="font-bold" onClick={() => navigate("/login")}>
                                Entrar
                            </Button>
                        )}
                        <Button className="gradient-primary rounded-full px-8 shadow-xl hover:scale-105 transition-all" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                            Começar Agora
                        </Button>
                    </div>

                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
                        <a href="#beneficios" onClick={() => setIsMenuOpen(false)}>Benefícios</a>
                        <a href="#cursos" onClick={() => setIsMenuOpen(false)}>Plataforma</a>
                        <a href="#precos" onClick={() => setIsMenuOpen(false)}>Assinatura</a>
                        <hr />
                        <Button variant="outline" onClick={() => navigate("/login")}>Entrar</Button>
                        <Button className="gradient-primary" onClick={() => { setIsMenuOpen(false); document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' }); }}>Assinar Agora</Button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
                            <Sparkles className="w-3 h-3" />
                            A Revolução da Mente Começa Aqui
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-primary whitespace-pre-line">
                            {settings.heroTitle}
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
                            {settings.heroSubtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="xl" className="w-full sm:w-auto gradient-primary text-lg h-16 px-10 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center gap-2" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                                Quero Minha Assinatura Premium
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <Button size="xl" variant="outline" className="w-full sm:w-auto h-16 px-10 rounded-2xl border-white/20 bg-white/5 backdrop-blur-lg hover:bg-white/10" onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}>
                                Ver Planos
                            </Button>
                        </div>

                        {/* Trusted BY */}
                        <div className="pt-12 flex flex-col items-center gap-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Reconhecido por Profissionais de:</p>
                            <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale contrast-125">
                                <span className="font-black text-xl italic uppercase">Neuroscience</span>
                                <span className="font-black text-xl italic uppercase">Psychology</span>
                                <span className="font-black text-xl italic uppercase">Hypnotherapy</span>
                                <span className="font-black text-xl italic uppercase">Coaching</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
            </section>

            {/* Features Grid */}
            <section id="beneficios" className="py-24 bg-primary/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain className="w-8 h-8 text-white" />,
                                title: "Neurociência Aplicada",
                                desc: "Conteúdo embasado na ciência moderna, unindo teoria robusta com prática clínica real."
                            },
                            {
                                icon: <Target className="w-8 h-8 text-white" />,
                                title: "Foco em Resultados",
                                desc: "Protocolos validados para acelerar processos terapêuticos e mudanças comportamentais."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-white" />,
                                title: "Certificação Oficial",
                                desc: "Certificados reconhecidos que atestam sua excelência e profissionalismo no mercado."
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="bg-background border-none shadow-xl hover:translate-y-[-8px] transition-all duration-300 overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-black mb-3 text-primary">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section id="cursos" className="py-24 overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black text-primary leading-tight">
                                Um Ecossistema Completo para <br />
                                <span className="text-transparent bg-clip-text gradient-accent">Sua Evolução.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Não somos apenas um curso, somos uma jornada vitalícia. Tenha acesso a uma biblioteca de conteúdos que se expande mensalmente, interaja com outros profissionais e participe de eventos exclusivos.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Acesso a +50 Cursos Especializados",
                                    "Materiais de Apoio e Apostilas Digitais",
                                    "Agenda de Eventos e Masterclasses ao Vivo",
                                    "Comunidade de Prática Exclusiva para Membros"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold text-primary">
                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Button size="lg" className="rounded-xl px-10 h-14" onClick={() => navigate("/assinatura")}>
                                Conhecer a Plataforma
                            </Button>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 group">
                                <img
                                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070"
                                    alt="Plataforma de Cursos"
                                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <p className="text-sm font-bold uppercase tracking-widest opacity-70">Avançado e Intuitivo</p>
                                        <h4 className="text-2xl font-black">Layout Premium & Player HD</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 gradient-accent rounded-full blur-3xl opacity-20 animate-pulse"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 gradient-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-24 gradient-primary relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-xl mx-auto text-center text-white space-y-6 mb-16">
                        <h2 className="text-4xl md:text-5xl font-black italic">Assinatura Premium</h2>
                        <p className="opacity-90 font-medium">Acesso total e irrestrito por apenas um pequeno investimento anual.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center bg-background rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
                        {/* Lado Esquerdo: Oferta */}
                        <div className="p-12 lg:p-16 bg-muted/30 space-y-8">
                            <div className="space-y-4">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase">Oferta de Lançamento</span>
                                <h3 className="text-4xl font-black tracking-tighter">Plano Anual Full</h3>
                                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                    Tenha acesso ilimitado a toda a nossa biblioteca de cursos, materiais e suporte especializado.
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">R$</span>
                                <span className="text-7xl font-black tracking-tighter text-primary">1,00</span>
                                <span className="text-xl font-bold text-muted-foreground">/ ano</span>
                            </div>

                            <div className="space-y-4 pt-4">
                                {[
                                    "Cursos de Hipnose e PNL",
                                    "Aulas com Especialistas",
                                    "Certificados de Conclusão",
                                    "Suporte no WhatsApp",
                                    "Acesso antecipado a eventos"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lado Direito: Checkout */}
                        <div className="p-12 lg:p-16 space-y-8">
                            <div className="text-center space-y-2 mb-4">
                                <h4 className="text-2xl font-black">Crie sua Conta</h4>
                                <p className="text-muted-foreground text-sm font-medium">Preencha abaixo para iniciar sua assinatura</p>
                            </div>

                            <CheckoutForm />
                        </div>
                    </div>
                </div>

                {/* Background shapes */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-border/40">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="flex items-center gap-2">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                                        <Brain className="text-white w-5 h-5" />
                                    </div>
                                )}
                                <span className="text-lg font-black tracking-tighter text-primary">{settings.appName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed font-medium">
                                Excelência no ensino de Hipnose e PNL aplicada. Transformando vidas e carreiras através do conhecimento neurocientífico.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-black text-primary uppercase text-xs tracking-widest">Navegação</h4>
                            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
                                <li><Link to="/login" className="hover:text-primary transition-colors">Acessar Conta</Link></li>
                                <li><a href="#cursos" className="hover:text-primary transition-colors">Cursos</a></li>
                                <li><a href="#precos" className="hover:text-primary transition-colors">Assinatura</a></li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-black text-primary uppercase text-xs tracking-widest">Legal</h4>
                            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-20 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">© 2024 Instituto Behn de Hipnose e PNL. Todos os direitos reservados.</p>
                        <div className="flex items-center gap-6 opacity-50 grayscale contrast-150">
                            <img src="/stripe-badge.png" alt="Seguro" className="h-4 hidden" />
                            <span className="text-[10px] font-black italic">STONECASH</span>
                            <span className="text-[10px] font-black italic">PAGAR.ME</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

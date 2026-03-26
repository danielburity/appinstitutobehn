
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, FileText, Phone, Lock, CheckCircle2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const checkoutSchema = z.object({
    name: z.string().min(3, "Nome muito curto"),
    email: z.string().email("Email inválido"),
    document: z.string().min(11, "CPF inválido").max(14, "Documento inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

export const CheckoutForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);
    const [listeningUserId, setListeningUserId] = useState<string | null>(null);

    // Efeito para escutar a aprovação do pagamento em tempo real
    React.useEffect(() => {
        if (!isCheckingPayment || !listeningUserId) return;

        console.log(`[POLLING] Iniciando escuta para o User ID: ${listeningUserId}`);
        const channel = supabase
            .channel(`public:profiles:id=eq.${listeningUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${listeningUserId}`
                },
                (payload) => {
                    console.log('[REALTIME] Mudança detectada:', payload.new);
                    if (payload.new.subscription_status === 'active') {
                        toast.success("Pagamento confirmado! Acessando...");
                        // Delay para o usuário ler o toast
                        setTimeout(() => {
                            window.location.href = "/home"; // Ajuste para a rota correta do seu app
                        }, 1500);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[REALTIME] Status da conexão: ${status}`);
            });

        // Fallback: Polling a cada 3 segundos caso o Realtime falhe
        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('subscription_status')
                .eq('id', listeningUserId)
                .single();

            if (data?.subscription_status === 'active') {
                toast.success("Pagamento confirmado! Redirecionando...");
                window.location.href = "/home";
                clearInterval(interval);
            }
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [isCheckingPayment, listeningUserId]);

    const { register, handleSubmit, formState: { errors } } = useForm<CheckoutData>({
        resolver: zodResolver(checkoutSchema),
    });

    const onSubmit = async (data: CheckoutData) => {
        setIsSubmitting(true);
        try {
            console.log(`[CHECKOUT] Iniciando fluxo unificado...`);

            // 1. Tentar obter usuário atual
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            let userId = currentUser?.id;

            // 2. Se não estiver logado, Criar Conta Primeiro
            if (!userId) {
                console.log(`[CHECKOUT] Criando conta para: ${data.email}`);
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: {
                            full_name: data.name,
                        }
                    }
                });

                if (signUpError) {
                    if (signUpError.message.includes("already registered")) {
                        console.log(`[CHECKOUT] E-mail já registrado. Tentando prosseguir com ID temporário de teste.`);
                        userId = `test_existing_${Date.now()}`;
                    } else if (signUpError.message.includes("rate limit") || signUpError.status === 429) {
                        toast.warning("Limite de contas atingido. Usando ID temporário para gerar link...");
                        userId = `test_ratelimit_${Date.now()}`;
                    } else {
                        throw new Error(`Erro ao criar conta: ${signUpError.message}`);
                    }
                } else {
                    userId = signUpData.user?.id;

                    // --- NOVA LÓGICA: AUTO-CADASTRO COMO TERAPEUTA ---
                    if (userId) {
                        console.log(`[CHECKOUT] Criando registro de terapeuta para: ${userId}`);
                        try {
                            const { error: therapistError } = await supabase.from('therapists').insert({
                                name: data.name,
                                contact_whatsapp: data.phone.replace(/\D/g, ''),
                                specialties: ["Hipnoterapia", "PNL"], // Especialidades padrão
                                selo_approved: true, // Aprovação automática conforme solicitado
                                city: "Consultar",
                                state: "UF"
                            });

                            if (therapistError) {
                                console.error("[CHECKOUT] Erro ao criar terapeuta:", therapistError);
                                // Não trava o fluxo se falhar o registro de terapeuta
                            } else {
                                console.log("[CHECKOUT] Registro de terapeuta criado com sucesso!");
                            }
                        } catch (e) {
                            console.error("[CHECKOUT] Falha crítica ao registrar terapeuta:", e);
                        }
                    }
                }

                if (userId) toast.success("Processando link de pagamento...");
            }

            console.log(`[CHECKOUT] Chamando Pagar.me para User: ${userId || 'Visitante'}`);

            const { data: response, error: invokeError } = await supabase.functions.invoke('create-pagarme-subscription', {
                body: {
                    user_id: userId || null,
                    plan_id: "plan_R5oAGgCBKfvYANlr",
                    redirect_url: `${window.location.origin}/home`,
                    is_new_user: !currentUser, // Identifica se a conta acabou de ser criada
                    customer: {
                        name: data.name,
                        email: data.email,
                        document: data.document.replace(/\D/g, '').substring(0, 11),
                        phone: {
                            area_code: data.phone.replace(/\D/g, '').substring(0, 2) || "11",
                            number: data.phone.replace(/\D/g, '').slice(-9)
                        }
                    },
                    meta: {
                        registration_date: new Date().toISOString(),
                        notification_email: "contato@institutobehn.com.br"
                    }
                }
            });

            if (invokeError) throw invokeError;
            if (response?.error) throw new Error(response.error.message);

            if (response?.url) {
                // SUCESSO: Abrir link e iniciar escuta
                window.open(response.url, '_blank');
                setListeningUserId(userId || null);
                setIsCheckingPayment(true); // Muda a tela para "Aguardando..."
                setStep(2); // Opcional, se quisermos usar steps
            } else {
                throw new Error("Não foi possível gerar o link de pagamento. Tente novamente.");
            }

        } catch (error: any) {
            console.error("ERRO COMPLETO AO INICIAR PAGAMENTO:", error); // ... manter log de erro existente
            let message = error?.message || "Erro desconhecido.";
            toast.error("Erro ao iniciar pagamento: " + (message.substring(0, 100) + "..."));
            setIsSubmitting(false);
        }
        // Nota: Não setamos setIsSubmitting(false) no sucesso para manter o loader/UI de espera
    };

    if (isCheckingPayment) {
        return (
            <Card className="border-2 border-primary/20 bg-accent/5 animate-in fade-in zoom-in duration-500">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase text-primary tracking-widest">
                        Aguardando Pagamento...
                    </CardTitle>
                    <CardDescription className="font-medium text-lg text-muted-foreground mt-2">
                        A página de pagamento foi aberta em uma nova aba.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-sm text-balance leading-relaxed text-muted-foreground/80">
                        Complete o pagamento na aba do Pagar.me. Assim que for confirmado,
                        esta tela atualizará automaticamente e liberará seu acesso.
                    </p>

                    <div className="p-4 bg-background/50 rounded-xl border border-border/50 text-xs text-muted-foreground flex flex-col gap-2">
                        <div className="flex items-center gap-2 justify-center">
                            <Lock className="w-3 h-3" />
                            <span>Monitorando confirmação segura...</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Liberação automática em segundos</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                        Já paguei, mas não atualizou
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-primary/60">Nome Completo</Label>
                    <div className="relative group">
                        <User className="absolute left-3 top-4 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input id="name" {...register("name")} className="pl-10 h-14 bg-accent/5 focus:bg-background border-border/50 rounded-2xl font-bold text-base shadow-sm transition-all" placeholder="Ex: Daniel Burity" />
                    </div>
                    {errors.name && <p className="text-xs text-destructive font-black px-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="document" className="text-xs font-black uppercase tracking-widest text-primary/60">CPF</Label>
                        <div className="relative group">
                            <FileText className="absolute left-3 top-4 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input id="document" {...register("document")} className="pl-10 h-14 bg-accent/5 focus:bg-background border-border/50 rounded-2xl font-bold text-base shadow-sm transition-all" placeholder="000.000.000-00" />
                        </div>
                        {errors.document && <p className="text-xs text-destructive font-black px-1">{errors.document.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-primary/60">WhatsApp</Label>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-4 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input id="phone" {...register("phone")} className="pl-10 h-14 bg-accent/5 focus:bg-background border-border/50 rounded-2xl font-bold text-base shadow-sm transition-all" placeholder="(00) 00000-0000" />
                        </div>
                        {errors.phone && <p className="text-xs text-destructive font-black px-1">{errors.phone.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-primary/60">E-mail para Acesso</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-4 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input id="email" {...register("email")} className="pl-10 h-14 bg-accent/5 focus:bg-background border-border/50 rounded-2xl font-bold text-base shadow-sm transition-all" placeholder="seu@email.com" />
                    </div>
                    {errors.email && <p className="text-xs text-destructive font-black px-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-primary/60">Escolha uma Senha</Label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-4 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input id="password" type="password" {...register("password")} className="pl-10 h-14 bg-accent/5 focus:bg-background border-border/50 rounded-2xl font-bold text-base shadow-sm transition-all" placeholder="Mínimo 6 caracteres" />
                    </div>
                    {errors.password && <p className="text-xs text-destructive font-black px-1">{errors.password.message}</p>}
                </div>
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 text-lg font-black rounded-2xl gradient-primary mt-8 shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        PROCESSANDO...
                    </span>
                ) : (
                    <>
                        IR PARA PAGAMENTO SEGURO
                        <CheckCircle2 className="w-5 h-5" />
                    </>
                )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-black tracking-widest uppercase pt-4">
                <Lock className="w-3 h-3 text-primary" />
                Pagamento 100% Seguro Pagar.me
            </div>
        </form>
    );
};

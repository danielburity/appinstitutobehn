
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "react-router-dom";
import { User, Mail, FileText, Phone, Lock, CheckCircle2, CreditCard } from "lucide-react";
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

// Helper: builds installment array for Pagar.me
const buildInstallments = (maxInstallments: number, totalAmount: number) =>
    Array.from({ length: maxInstallments }, (_, i) => ({
        number: i + 1,
        total: totalAmount
    }));

export const CheckoutForm = ({ showInstallmentPicker = false }: { showInstallmentPicker?: boolean }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [listeningUserId, setListeningUserId] = useState<string | null>(null);
    const [installments, setInstallments] = useState(1);
    const [coursePrice, setCoursePrice] = useState<number | null>(null);
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get("course_id");
    const courseTitle = searchParams.get("course_title");

    // Max installments: 12x for platform, 10x for individual courses
    const maxInstallments = courseId ? 10 : 12;

    // Fetch course price to show accurate per-installment values
    useEffect(() => {
        if (!courseId) {
            setCoursePrice(180000); // R$ 1.800,00 em centavos — Plataforma + Afiliados Behn
            return;
        }
        supabase
            .from('courses')
            .select('price')
            .eq('id', courseId)
            .single()
            .then(({ data }) => {
                if (data?.price && data.price > 0) setCoursePrice(data.price);
                else setCoursePrice(100); // fallback R$ 1,00
            });
    }, [courseId]);

    const formatCurrency = (cents: number) =>
        `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

    const pricePerInstallment = coursePrice
        ? coursePrice / installments
        : null;

    // Efeito para escutar a aprovação do pagamento em tempo real
    React.useEffect(() => {
        if (!isCheckingPayment || !listeningUserId) return;

        if (courseId) {
            console.log(`[POLLING] Iniciando escuta de curso (ID: ${courseId}) para User: ${listeningUserId}`);
            const interval = setInterval(async () => {
                const { data } = await supabase
                    .from('user_courses')
                    .select('id')
                    .eq('user_id', listeningUserId)
                    .eq('course_id', courseId)
                    .maybeSingle();

                if (data) {
                    toast.success("Pagamento confirmado! Acessando curso...");
                    setTimeout(() => {
                        window.location.href = `/curso/${courseId}/assistir`;
                    }, 1500);
                    clearInterval(interval);
                }
            }, 3000);
            return () => clearInterval(interval);
        }

        console.log(`[POLLING] Iniciando escuta de assinatura para o User ID: ${listeningUserId}`);
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
    }, [isCheckingPayment, listeningUserId, courseId]);

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

            // Se o picker está oculto (landing page), envia maxInstallments para o Pagar.me
            // disponibilizar todas as opções de parcelamento no checkout deles.
            // Se o picker está visível (/assinatura), usa a escolha do usuário.
            const installmentsToSend = showInstallmentPicker ? installments : maxInstallments;

            console.log(`[CHECKOUT] Chamando Pagar.me para User: ${userId || 'Visitante'} | Parcelas enviadas: ${installmentsToSend}x (picker: ${showInstallmentPicker})`);

            const { data: response, error: invokeError } = await supabase.functions.invoke('create-pagarme-subscription', {
                body: {
                    user_id: userId || null,
                    plan_id: courseId ? "course_trainer" : "plan_R5oAGgCBKfvYANlr",
                    course_id: courseId || null,
                    course_title: courseTitle || null,
                    installments: installmentsToSend,
                    redirect_url: courseId ? `${window.location.origin}/curso/${courseId}/assistir` : `${window.location.origin}/home`,
                    is_new_user: !currentUser,
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
                // SUCESSO: Redirecionar na mesma janela (resolve bloqueio de popup em mobile/Safari)
                setPaymentUrl(response.url);
                setListeningUserId(userId || null);
                setIsCheckingPayment(true); // Mostra tela de redirecionamento
                setStep(2);
                
                // Pequeno delay para a tela de "Redirecionando..." aparecer antes de navegar
                setTimeout(() => {
                    window.location.href = response.url;
                }, 1500);
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
                        Redirecionando...
                    </CardTitle>
                    <CardDescription className="font-medium text-lg text-muted-foreground mt-2">
                        Você será levado para a página de pagamento em instantes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-sm text-balance leading-relaxed text-muted-foreground/80">
                        Se não for redirecionado automaticamente, clique no botão abaixo.
                    </p>

                    {paymentUrl && (
                        <Button
                            asChild
                            className="w-full h-12 text-sm font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                        >
                            <a href={paymentUrl} rel="noopener noreferrer">
                                IR PARA PÁGINA DE PAGAMENTO <Lock className="w-4 h-4 ml-1" />
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Seletor de Parcelamento (só visível na página /assinatura) ── */}
            {showInstallmentPicker && (
            <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Parcelamento no Cartão de Crédito
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: maxInstallments }, (_, i) => {
                        const n = i + 1;
                        const perInstallment = coursePrice ? coursePrice / n : null;
                        return (
                            <button
                                type="button"
                                key={n}
                                onClick={() => setInstallments(n)}
                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center cursor-pointer ${
                                    installments === n
                                        ? 'border-primary bg-primary/10 shadow-md shadow-primary/20 scale-[1.04]'
                                        : 'border-border/50 bg-accent/5 hover:border-primary/40 hover:bg-primary/5'
                                }`}
                            >
                                <span className={`text-base font-black leading-none ${
                                    installments === n ? 'text-primary' : 'text-foreground'
                                }`}>{n}×</span>
                                {perInstallment !== null && (
                                    <span className={`text-[10px] font-semibold mt-1 leading-tight ${
                                        installments === n ? 'text-primary/80' : 'text-muted-foreground'
                                    }`}>
                                        {formatCurrency(perInstallment)}
                                    </span>
                                )}
                                {installments === n && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {coursePrice && (
                    <p className="text-xs text-muted-foreground text-center">
                        {installments === 1
                            ? `Pagamento à vista de ${formatCurrency(coursePrice)}`
                            : `${installments}× de ${formatCurrency(coursePrice / installments)} = ${formatCurrency(coursePrice)} no total`
                        }
                    </p>
                )}
            </div>
            )}

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


import React, { useState } from "react";
import { Check, CreditCard, Shield, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutForm } from "@/components/subscription/CheckoutForm";

const Subscription = () => {
    console.log("Subscription page mounted");
    const [showCheckout, setShowCheckout] = useState(false);

    // Benefícios do plano
    const benefits = [
        "Acesso ilimitado a todos os cursos",
        "Participação em eventos exclusivos",
        "Materiais de apoio para download",
        "Suporte prioritário via WhatsApp",
        "Certificados de conclusão",
        "Conteúdos novos toda semana"
    ];

    if (showCheckout) {
        return (
            <div className="container max-w-4xl py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                    variant="ghost"
                    onClick={() => setShowCheckout(false)}
                    className="mb-8 hover:bg-secondary/10"
                >
                    ← Voltar aos planos
                </Button>
                <CheckoutForm />
            </div>
        );
    }

    return (
        <div className="container py-16 px-4">
            <div className="text-center mb-16 space-y-4">
                <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 mb-4">
                    Upgrade para Premium
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                    Invista na sua <span className="text-primary italic">Saúde Mental</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Tenha acesso total a todas as ferramentas do Instituto Behn e transforme sua jornada de autoconhecimento hoje.
                </p>
            </div>

            <div className="max-w-md mx-auto relative">
                {/* Efeito de brilho atrás do card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent-blue rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                <Card className="relative border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl rounded-[1.5rem] overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                        <Sparkles className="text-primary w-6 h-6 animate-pulse" />
                    </div>

                    <CardHeader className="text-center pt-10">
                        <CardTitle className="text-2xl font-bold">Plano Mensal</CardTitle>
                        <CardDescription className="text-primary font-medium tracking-wide">
                            APP INSTITUTO BEHN
                        </CardDescription>
                        <div className="mt-6 flex flex-col items-center">
                            <span className="text-5xl font-black">R$ 99,90</span>
                            <span className="text-muted-foreground text-sm font-medium mt-1">por mês</span>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 py-8">
                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground/80">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>

                    <CardFooter className="pb-10 px-8">
                        <Button
                            className="w-full h-14 text-lg font-bold rounded-xl gradient-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                            onClick={() => setShowCheckout(true)}
                        >
                            Assinar Agora
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Informação de segurança */}
                <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/60">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-tighter">Pagamento Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-tighter">Acesso Imediato</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;

import { useState, useRef, Component } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, Save, User as UserIcon, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/admin/ImageUpload";

// Error Boundary para capturar erros de renderização e evitar tela branca
class ProfileErrorBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[Profile] Erro de renderização:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-2xl mx-auto pt-10 pb-32 space-y-6 text-center animate-in fade-in duration-700">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 space-y-4">
                        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-bold text-foreground">Erro ao carregar perfil</h2>
                        <p className="text-muted-foreground">
                            Ocorreu um erro ao renderizar esta página. Isso pode acontecer por um problema temporário.
                        </p>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="bg-accent hover:bg-accent/90 text-white font-bold"
                        >
                            Tentar Novamente
                        </Button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const ProfileContent = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ full_name: fullName, avatar_url: avatarUrl })
                .eq("id", user.id);
                
            // Sync the avatar to therapists table as well, matching by name since therapists has no ID relationship
            if (profile?.full_name) {
                await supabase
                    .from("therapists")
                    .update({ avatar_url: avatarUrl, name: fullName })
                    .eq("name", profile.full_name);
            } else if (fullName) {
                await supabase
                    .from("therapists")
                    .update({ avatar_url: avatarUrl, name: fullName })
                    .eq("name", fullName);
            }

            if (error) {
                toast.error("Erro ao atualizar perfil: " + error.message);
            } else {
                await refreshProfile();
                toast.success("Perfil atualizado com sucesso!");
            }
        } catch (err: any) {
            console.error('[Profile] Erro ao salvar:', err);
            toast.error("Erro inesperado ao salvar perfil. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="max-w-2xl mx-auto pt-10 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center space-y-4">

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Configurações de Perfil</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                </div>
            </div>

            <Card className="border-border/40 bg-card/50 backdrop-blur-md shadow-xl">
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                        Atualize suas informações para que outros membros saibam quem você é.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-4">
                            <ImageUpload
                                label="Foto de Perfil"
                                value={avatarUrl}
                                onChange={setAvatarUrl}
                                folder="avatars"
                                bucket="avatars"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input
                                id="fullName"
                                placeholder="Seu nome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-muted/50 focus-visible:ring-accent"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 rounded-xl transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Segurança</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Deseja alterar sua senha ou gerenciar acessos?
                </p>
                <Button 
                    variant="outline" 
                    className="w-full border-accent/20 hover:bg-accent/10 hover:text-accent transition-colors"
                    onClick={async () => {
                        if (user?.email) {
                            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                              redirectTo: window.location.origin + '/login?type=recovery',
                            });
                            if (error) {
                                toast.error('Erro ao enviar email de redefinição.');
                            } else {
                                toast.success('Email de redefinição de senha enviado!');
                            }
                        }
                    }}
                >
                    Gerenciar Segurança (Alterar Senha)
                </Button>
            </div>

            <Button 
                variant="destructive" 
                className="w-full font-bold h-12 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-8"
                onClick={async () => {
                    await signOut();
                    navigate('/login');
                    toast.success('Até logo!');
                }}
            >
                <LogOut className="w-5 h-5" />
                Sair da conta
            </Button>
        </div>
    );
};

const Profile = () => (
    <ProfileErrorBoundary>
        <ProfileContent />
    </ProfileErrorBoundary>
);

export default Profile;

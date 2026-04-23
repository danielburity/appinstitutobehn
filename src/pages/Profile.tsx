import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, Save, User as UserIcon, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/admin/ImageUpload";

const Profile = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const { error } = await supabase
            .from("profiles")
            .update({ full_name: fullName, avatar_url: avatarUrl })
            .eq("id", user.id);
            
        // Sync the avatar to therapists table as well, so their profile picture updates everywhere
        await supabase
            .from("therapists")
            .update({ avatar_url: avatarUrl, name: fullName })
            .eq("id", user.id);

        setLoading(false);
        if (error) {
            toast.error("Erro ao atualizar perfil: " + error.message);
        } else {
            await refreshProfile();
            toast.success("Perfil atualizado com sucesso!");
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

export default Profile;

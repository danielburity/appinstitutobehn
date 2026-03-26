import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSettings } from '@/context/SettingsContext';
import { Mail, Lock, Eye, EyeOff, Brain } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function Login() {
  const { signIn, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  type FromState = { from?: { pathname: string } } | null;

  async function submit() {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao realizar login';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      const state = location.state as FromState;
      const from = state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  return (
    user ? <Navigate to="/home" replace /> : (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-4" style={{ backgroundColor: `hsl(${settings.primaryColor})`}}>
        
        {/* Logo and Header */}
        <div className="w-full max-w-sm flex flex-col items-center mb-8 space-y-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-auto w-full max-w-[240px] md:max-w-[280px] object-contain drop-shadow-md" />
          ) : (
             <div className="flex items-center gap-2 text-white">
                <Brain className="w-12 h-12" />
                <span className="text-4xl font-black tracking-tighter">{settings.appName}</span>
             </div>
          )}
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
            <p className="text-white/80 font-medium">Faça login para acessar sua conta</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  id="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  type="email" 
                  placeholder="seu@email.com"
                  className="pl-10 h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-primary placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  id="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-primary placeholder:text-slate-400"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:text-white" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                >
                  Lembrar de mim
                </label>
              </div>
              <button type="button" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg mt-4 transition-colors" 
              disabled={loading} 
              onClick={submit}
            >
              {loading ? 'Processando...' : 'Entrar'}
            </Button>
            
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
            <p className="text-white/90 text-sm">
              Não tem uma conta?{' '}
              <button onClick={() => navigate('/assinatura')} className="font-bold text-white hover:underline transition-all">
                Criar uma conta
              </button>
            </p>
        </div>

      </div>
    )
  );
}

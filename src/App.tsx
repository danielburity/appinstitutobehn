import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MessageCircle, Brain } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CoursePlayer from "./pages/CoursePlayer";
import Therapists from "./pages/Therapists";
import Events from "./pages/Events";
import BecomeAffiliate from "./pages/BecomeAffiliate";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import LandingPage from "./pages/LandingPage";
import { useSettings } from "./context/SettingsContext";

const queryClient = new QueryClient();

const RootApp = () => {
  const { loading, settings } = useSettings();
  const [showLoadingDelay, setShowLoadingDelay] = useState(true);

  useEffect(() => {
    // Artificial 2.5s minimum delay for the loading animation setup
    const timer = setTimeout(() => {
      setShowLoadingDelay(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading || showLoadingDelay) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
        <div className="z-10 flex flex-col items-center animate-in fade-in duration-1000">
          {settings?.logoUrl ? (
             <img src={settings.logoUrl} alt="Logo" className="w-[200px] max-w-[80vw] object-contain mb-8 animate-pulse" />
          ) : (
             <div className="w-24 h-24 mb-8 bg-white/5 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)]">
               <Brain className="w-12 h-12 text-[#25D366] animate-pulse" />
             </div>
          )}
          <div className="mt-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-white animate-spin"></div>
            <p className="text-white/60 mt-4 text-sm font-medium tracking-wider uppercase animate-pulse">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Routes>
      {/* Rota Pública da Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Rotas Protegidas com Layout de Dashboard */}
      <Route
        path="/*"
        element={
          <ProtectedRoute requireMember>
            <Layout>
              <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/cursos" element={<Courses />} />
                <Route path="/curso/:id" element={<CourseDetail />} />
                <Route path="/curso/:courseId/assistir" element={<CoursePlayer />} />
                <Route path="/terapeutas" element={<Therapists />} />
                <Route path="/eventos" element={<Events />} />
                <Route path="/seja-parceiro" element={<BecomeAffiliate />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin>{<Admin />}</ProtectedRoute>} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/assinatura" element={<Subscription />} />
    </Routes>
  </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SettingsProvider>
            <RootApp />
          </SettingsProvider>
        </BrowserRouter>

        {/* Botão Flutuante WhatsApp Global (Fora de tudo para visibilidade absoluta) */}
        <a
          href="https://wa.me/5511913035220"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 md:bottom-8 right-6 z-[99999] bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:scale-110 hover:shadow-[0_8px_40px_rgba(37,211,102,0.4)] transition-all active:scale-95 group flex items-center justify-center border-2 border-white/20"
          title="Suporte via WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-white text-white" />
          <span className="absolute right-full mr-3 bg-[#10121f] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-2xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none border border-white/10">
            Suporte WhatsApp
          </span>
        </a>

      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
  appName: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  heroCta1: string;
  heroCta2: string;
  // Features cards (Benefícios)
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  // Platform section
  platformTitle: string;
  platformSubtitle: string;
  platformBullet1: string;
  platformBullet2: string;
  platformBullet3: string;
  platformBullet4: string;
  // Pricing section (landing /#precos)
  pricingSectionTitle: string;
  pricingSectionSubtitle: string;
  pricingBadge: string;
  pricingPlanName: string;
  pricingPlanDesc: string;
  pricingValue: string;
  pricingInstallments: string;
  pricingBenefit1: string;
  pricingBenefit2: string;
  pricingBenefit3: string;
  pricingBenefit4: string;
  pricingBenefit5: string;
  pricingFormTitle: string;
  pricingFormSubtitle: string;
  // Subscription page (/assinatura)
  subscriptionPlanName: string;
  subscriptionPrice: string;
  subscriptionInstallments: string;
  subscriptionBenefit1: string;
  subscriptionBenefit2: string;
  subscriptionBenefit3: string;
  subscriptionBenefit4: string;
  subscriptionBenefit5: string;
  subscriptionBenefit6: string;
  // Footer
  footerTagline: string;
  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  appBackground?: string;
  sidebarBackground?: string;
  sidebarText?: string;
  logoUrl?: string;
  eventButtonColor?: string;
  eventBadgeOnlineColor?: string;
  eventBadgePresencialColor?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: "INSTITUTO BEHN",
  heroTitle: "Onde o Conhecimento\nTransforma Vidas.",
  heroSubtitle: "Domine a Hipnose e a PNL com o Instituto mais respeitado do país.\nUma plataforma completa de aprendizado, prática clínica e comunidade de elite.",
  heroBadgeText: "A Revolução da Mente Começa Aqui",
  heroCta1: "Quero Minha Assinatura Premium",
  heroCta2: "Ver Planos",
  feature1Title: "Neurociência Aplicada",
  feature1Desc: "Conteúdo embasado na ciência moderna, unindo teoria robusta com prática clínica real.",
  feature2Title: "Foco em Resultados",
  feature2Desc: "Protocolos validados para acelerar processos terapêuticos e mudanças comportamentais.",
  feature3Title: "Certificação Oficial",
  feature3Desc: "Certificados reconhecidos que atestam sua excelência e profissionalismo no mercado.",
  platformTitle: "Um Ecossistema Completo para\nSua Evolução.",
  platformSubtitle: "Não somos apenas um curso, somos uma jornada vitalícia. Tenha acesso a uma biblioteca de conteúdos que se expande mensalmente, interaja com outros profissionais e participe de eventos exclusivos.",
  platformBullet1: "Acesso a +50 Cursos Especializados",
  platformBullet2: "Materiais de Apoio e Apostilas Digitais",
  platformBullet3: "Agenda de Eventos e Masterclasses ao Vivo",
  platformBullet4: "Comunidade de Prática Exclusiva para Membros",
  pricingSectionTitle: "Assinatura Premium",
  pricingSectionSubtitle: "Acesso total e irrestrito por apenas um pequeno investimento anual.",
  pricingBadge: "Oferta de Lançamento",
  pricingPlanName: "Plano Anual Full",
  pricingPlanDesc: "Tenha acesso ilimitado a toda a nossa biblioteca de cursos, materiais e suporte especializado.",
  pricingValue: "1.800",
  pricingInstallments: "ou 12× de R$ 150,00",
  pricingBenefit1: "Cursos de Hipnose e PNL",
  pricingBenefit2: "Aulas com Especialistas",
  pricingBenefit3: "Certificados de Conclusão",
  pricingBenefit4: "Suporte no WhatsApp",
  pricingBenefit5: "Acesso antecipado a eventos",
  pricingFormTitle: "Crie sua Conta",
  pricingFormSubtitle: "Preencha abaixo para iniciar sua assinatura",
  subscriptionPlanName: "Plano Mensal",
  subscriptionPrice: "R$ 1.800",
  subscriptionInstallments: "à vista ou 12× de R$ 150,00",
  subscriptionBenefit1: "Acesso ilimitado a todos os cursos",
  subscriptionBenefit2: "Participação em eventos exclusivos",
  subscriptionBenefit3: "Materiais de apoio para download",
  subscriptionBenefit4: "Suporte prioritário via WhatsApp",
  subscriptionBenefit5: "Certificados de conclusão",
  subscriptionBenefit6: "Conteúdos novos toda semana",
  footerTagline: "Excelência no ensino de Hipnose e PNL aplicada. Transformando vidas e carreiras através do conhecimento neurocientífico.",
  dashboardTitle: "O MAIS COMPLETO INSTITUTO DE HIPNOSE E PNL DO BRASIL",
  dashboardSubtitle: "Transforme sua carreira com cursos de excelência, ministrados por especialistas reconhecidos",
  primaryColor: "234 97% 17%",
  secondaryColor: "283 100% 21%",
  accentColor: "253 39% 50%",
  appBackground: "0 0% 97%",
  sidebarBackground: "234 97% 17%",
  sidebarText: "0 0% 100%",
  logoUrl: "",
  eventButtonColor: "234 97% 17%",
  eventBadgeOnlineColor: "210 100% 50%",
  eventBadgePresencialColor: "210 40% 96%"
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  loading: true
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    applyThemeVariables(settings);
  }, [settings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error && error.code !== '42P01') {
        console.error("Error loading settings:", error);
      }

      if (data && data.length > 0) {
        const settingsMap: Partial<AppSettings> = {};
        data.forEach(item => {
          if (item.key in DEFAULT_SETTINGS) {
            settingsMap[item.key as keyof AppSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const oldSettings = { ...settings };
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      for (const [key, value] of Object.entries(newSettings)) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ key, value }, { onConflict: 'key' });

        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (err: any) {
      setSettings(oldSettings);
      throw err;
    }
  };

  const applyThemeVariables = (opts: AppSettings) => {
    const root = document.documentElement;
    if (opts.primaryColor) root.style.setProperty('--primary', opts.primaryColor);
    if (opts.secondaryColor) root.style.setProperty('--secondary', opts.secondaryColor);
    if (opts.accentColor) root.style.setProperty('--accent', opts.accentColor);
    if (opts.appBackground) root.style.setProperty('--background', opts.appBackground);

    if (opts.sidebarBackground) {
      root.style.setProperty('--sidebar-background', opts.sidebarBackground);
    } else if (opts.primaryColor) {
      root.style.setProperty('--sidebar-background', opts.primaryColor);
    }

    if (opts.sidebarText) {
      root.style.setProperty('--sidebar-foreground', opts.sidebarText);
      root.style.setProperty('--primary-foreground', opts.sidebarText);
    }

    if (opts.primaryColor && opts.secondaryColor) {
      root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${opts.primaryColor}), hsl(${opts.secondaryColor}))`);
    }
    if (opts.accentColor) {
      root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${opts.accentColor}), hsl(210 86% 61%))`);
    }

    if (opts.eventButtonColor) root.style.setProperty('--event-button', opts.eventButtonColor);
    else if (opts.primaryColor) root.style.setProperty('--event-button', opts.primaryColor);

    if (opts.eventBadgeOnlineColor) root.style.setProperty('--event-badge-online', opts.eventBadgeOnlineColor);
    if (opts.eventBadgePresencialColor) root.style.setProperty('--event-badge-presencial', opts.eventBadgePresencialColor);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

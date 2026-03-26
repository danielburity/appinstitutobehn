import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  primaryColor: string; // HSL format, e.g. "234 97% 17%"
  secondaryColor: string;
  accentColor: string;
  appBackground?: string;
  sidebarBackground?: string;
  sidebarText?: string;
  logoUrl?: string; // Optional custom logo to replace the brain icon
  eventButtonColor?: string;
  eventBadgeOnlineColor?: string;
  eventBadgePresencialColor?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: "INSTITUTO BEHN",
  heroTitle: "Onde o Conhecimento\nTransforma Vidas.",
  heroSubtitle: "Domine a Hipnose e a PNL com o Instituto mais respeitado do país.\nUma plataforma completa de aprendizado, prática clínica e comunidade de elite.",
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
        
      if (error && error.code !== '42P01') { // Ignore table doesn't exist error locally if user didn't create it yet
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
      setSettings(oldSettings); // Rollback changes if save fails
      throw err;
    }
  };

  const applyThemeVariables = (opts: AppSettings) => {
    const root = document.documentElement;
    if (opts.primaryColor) root.style.setProperty('--primary', opts.primaryColor);
    if (opts.secondaryColor) root.style.setProperty('--secondary', opts.secondaryColor);
    if (opts.accentColor) root.style.setProperty('--accent', opts.accentColor);
    
    if (opts.appBackground) root.style.setProperty('--background', opts.appBackground);
    
    // Default to primary if sidebar colors are not set for backwards compatibility
    if (opts.sidebarBackground) {
      root.style.setProperty('--sidebar-background', opts.sidebarBackground);
    } else if (opts.primaryColor) {
      root.style.setProperty('--sidebar-background', opts.primaryColor);
    }
    
    // Sidebar/Header text color
    if (opts.sidebarText) {
      root.style.setProperty('--sidebar-foreground', opts.sidebarText);
      root.style.setProperty('--primary-foreground', opts.sidebarText);
    }

    // Update gradients using these colors to match the app's original structure
    if (opts.primaryColor && opts.secondaryColor) {
      root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${opts.primaryColor}), hsl(${opts.secondaryColor}))`);
    }
    if (opts.accentColor) {
      // Assuming a slight variation for the gradient-accent
      root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${opts.accentColor}), hsl(210 86% 61%))`);
    }

    // Event colors
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

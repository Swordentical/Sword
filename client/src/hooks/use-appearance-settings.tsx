import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { WallpaperPreset } from "@/components/animated-background";

export interface AppearanceSettings {
  wallpaperPreset: WallpaperPreset;
  sidebarTransparency: number;
  sidebarBlur: number;
  elementsTransparency: number;
  elementsBlur: number;
  showFloatingElements: boolean;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  wallpaperPreset: "geometric",
  sidebarTransparency: 80,
  sidebarBlur: 20,
  elementsTransparency: 50,
  elementsBlur: 20,
  showFloatingElements: true,
};

interface AppearanceSettingsContextType {
  settings: AppearanceSettings;
  updateSettings: (updates: Partial<AppearanceSettings>) => void;
  resetToDefaults: () => void;
}

const AppearanceSettingsContext = createContext<AppearanceSettingsContextType | undefined>(undefined);

const STORAGE_KEY = "dental-clinic-appearance";

export function AppearanceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    
    const root = document.documentElement;
    root.style.setProperty('--sidebar-transparency', `${(100 - settings.sidebarTransparency) / 100}`);
    root.style.setProperty('--sidebar-blur', `${settings.sidebarBlur / 10}px`);
    root.style.setProperty('--elements-transparency', `${(100 - settings.elementsTransparency) / 100}`);
    root.style.setProperty('--elements-blur', `${settings.elementsBlur / 10}px`);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppearanceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <AppearanceSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </AppearanceSettingsContext.Provider>
  );
}

export function useAppearanceSettings() {
  const context = useContext(AppearanceSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSettings: () => {},
      resetToDefaults: () => {},
    };
  }
  return context;
}

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { triggerThemeTransition } from "./theme-transition-layer";

type Theme = "dark" | "light" | "dusk" | "system";
type ResolvedTheme = "dark" | "light" | "dusk";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setThemeWithAnimation: (theme: Theme, x: number, y: number) => void;
  resolvedTheme: ResolvedTheme;
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "dental-clinic-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "dusk");

    let resolved: ResolvedTheme;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = theme;
    }

    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark", "dusk");
        const resolved = e.matches ? "dark" : "light";
        root.classList.add(resolved);
        setResolvedTheme(resolved);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setThemeWithAnimation = useCallback((newTheme: Theme, x: number, y: number) => {
    // Determine the target resolved theme
    let targetResolved: ResolvedTheme;
    if (newTheme === 'system') {
      targetResolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      targetResolved = newTheme;
    }
    
    // Trigger the global overlay transition
    triggerThemeTransition(x, y, targetResolved);
    
    // Small delay to let the overlay start, then change the actual theme
    setTimeout(() => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    }, 50);
  }, [storageKey]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    setThemeWithAnimation,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

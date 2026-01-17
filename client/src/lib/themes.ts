export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  ring: string;
  sidebarRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Medical Teal",
    colors: {
      light: {
        primary: "195 85% 40%",
        primaryForeground: "0 0% 100%",
        accent: "195 30% 92%",
        accentForeground: "195 70% 28%",
        sidebarPrimary: "195 85% 40%",
        sidebarPrimaryForeground: "0 0% 100%",
        sidebarAccent: "195 30% 92%",
        sidebarAccentForeground: "195 70% 30%",
        ring: "195 85% 40%",
        sidebarRing: "195 85% 40%",
        chart1: "195 85% 40%",
        chart2: "160 65% 45%",
        chart3: "35 90% 55%",
        chart4: "280 65% 55%",
        chart5: "350 75% 55%",
      },
      dark: {
        primary: "195 80% 50%",
        primaryForeground: "215 25% 9%",
        accent: "195 25% 18%",
        accentForeground: "195 60% 70%",
        sidebarPrimary: "195 80% 50%",
        sidebarPrimaryForeground: "215 25% 9%",
        sidebarAccent: "195 25% 18%",
        sidebarAccentForeground: "195 60% 70%",
        ring: "195 80% 50%",
        sidebarRing: "195 80% 50%",
        chart1: "195 80% 50%",
        chart2: "160 60% 50%",
        chart3: "35 85% 60%",
        chart4: "280 60% 60%",
        chart5: "350 70% 60%",
      },
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    colors: {
      light: {
        primary: "220 85% 50%",
        primaryForeground: "0 0% 100%",
        accent: "220 30% 92%",
        accentForeground: "220 70% 30%",
        sidebarPrimary: "220 85% 50%",
        sidebarPrimaryForeground: "0 0% 100%",
        sidebarAccent: "220 30% 92%",
        sidebarAccentForeground: "220 70% 30%",
        ring: "220 85% 50%",
        sidebarRing: "220 85% 50%",
        chart1: "220 85% 50%",
        chart2: "200 70% 50%",
        chart3: "180 60% 45%",
        chart4: "260 60% 55%",
        chart5: "340 70% 55%",
      },
      dark: {
        primary: "220 80% 60%",
        primaryForeground: "220 25% 9%",
        accent: "220 25% 20%",
        accentForeground: "220 60% 75%",
        sidebarPrimary: "220 80% 60%",
        sidebarPrimaryForeground: "220 25% 9%",
        sidebarAccent: "220 25% 20%",
        sidebarAccentForeground: "220 60% 75%",
        ring: "220 80% 60%",
        sidebarRing: "220 80% 60%",
        chart1: "220 80% 60%",
        chart2: "200 65% 55%",
        chart3: "180 55% 50%",
        chart4: "260 55% 60%",
        chart5: "340 65% 60%",
      },
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    colors: {
      light: {
        primary: "150 70% 35%",
        primaryForeground: "0 0% 100%",
        accent: "150 30% 90%",
        accentForeground: "150 60% 25%",
        sidebarPrimary: "150 70% 35%",
        sidebarPrimaryForeground: "0 0% 100%",
        sidebarAccent: "150 30% 90%",
        sidebarAccentForeground: "150 60% 28%",
        ring: "150 70% 35%",
        sidebarRing: "150 70% 35%",
        chart1: "150 70% 35%",
        chart2: "120 55% 45%",
        chart3: "80 60% 50%",
        chart4: "45 75% 55%",
        chart5: "180 50% 45%",
      },
      dark: {
        primary: "150 65% 45%",
        primaryForeground: "150 25% 9%",
        accent: "150 25% 18%",
        accentForeground: "150 55% 70%",
        sidebarPrimary: "150 65% 45%",
        sidebarPrimaryForeground: "150 25% 9%",
        sidebarAccent: "150 25% 18%",
        sidebarAccentForeground: "150 55% 70%",
        ring: "150 65% 45%",
        sidebarRing: "150 65% 45%",
        chart1: "150 65% 45%",
        chart2: "120 50% 50%",
        chart3: "80 55% 55%",
        chart4: "45 70% 60%",
        chart5: "180 45% 50%",
      },
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    colors: {
      light: {
        primary: "270 70% 50%",
        primaryForeground: "0 0% 100%",
        accent: "270 30% 92%",
        accentForeground: "270 60% 35%",
        sidebarPrimary: "270 70% 50%",
        sidebarPrimaryForeground: "0 0% 100%",
        sidebarAccent: "270 30% 92%",
        sidebarAccentForeground: "270 60% 35%",
        ring: "270 70% 50%",
        sidebarRing: "270 70% 50%",
        chart1: "270 70% 50%",
        chart2: "300 55% 50%",
        chart3: "240 60% 55%",
        chart4: "330 65% 55%",
        chart5: "200 55% 50%",
      },
      dark: {
        primary: "270 65% 60%",
        primaryForeground: "270 25% 9%",
        accent: "270 25% 20%",
        accentForeground: "270 55% 75%",
        sidebarPrimary: "270 65% 60%",
        sidebarPrimaryForeground: "270 25% 9%",
        sidebarAccent: "270 25% 20%",
        sidebarAccentForeground: "270 55% 75%",
        ring: "270 65% 60%",
        sidebarRing: "270 65% 60%",
        chart1: "270 65% 60%",
        chart2: "300 50% 55%",
        chart3: "240 55% 60%",
        chart4: "330 60% 60%",
        chart5: "200 50% 55%",
      },
    },
  },
  {
    id: "coral",
    name: "Coral",
    colors: {
      light: {
        primary: "16 85% 55%",
        primaryForeground: "0 0% 100%",
        accent: "16 40% 92%",
        accentForeground: "16 70% 35%",
        sidebarPrimary: "16 85% 55%",
        sidebarPrimaryForeground: "0 0% 100%",
        sidebarAccent: "16 40% 92%",
        sidebarAccentForeground: "16 70% 35%",
        ring: "16 85% 55%",
        sidebarRing: "16 85% 55%",
        chart1: "16 85% 55%",
        chart2: "35 80% 55%",
        chart3: "350 70% 55%",
        chart4: "45 85% 55%",
        chart5: "180 55% 45%",
      },
      dark: {
        primary: "16 80% 60%",
        primaryForeground: "16 25% 9%",
        accent: "16 25% 20%",
        accentForeground: "16 60% 75%",
        sidebarPrimary: "16 80% 60%",
        sidebarPrimaryForeground: "16 25% 9%",
        sidebarAccent: "16 25% 20%",
        sidebarAccentForeground: "16 60% 75%",
        ring: "16 80% 60%",
        sidebarRing: "16 80% 60%",
        chart1: "16 80% 60%",
        chart2: "35 75% 60%",
        chart3: "350 65% 60%",
        chart4: "45 80% 60%",
        chart5: "180 50% 50%",
      },
    },
  },
];

const THEME_STORAGE_KEY = "dental-clinic-theme";

export function getStoredTheme(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem(THEME_STORAGE_KEY) || "default";
}

export function setStoredTheme(themeId: string): void {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function applyTheme(themeId: string, isDark: boolean): void {
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const root = document.documentElement;

  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryForeground);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.accentForeground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
  root.style.setProperty("--ring", colors.ring);
  root.style.setProperty("--sidebar-ring", colors.sidebarRing);
  root.style.setProperty("--chart-1", colors.chart1);
  root.style.setProperty("--chart-2", colors.chart2);
  root.style.setProperty("--chart-3", colors.chart3);
  root.style.setProperty("--chart-4", colors.chart4);
  root.style.setProperty("--chart-5", colors.chart5);
}

export function getThemeById(themeId: string): Theme | undefined {
  return themes.find((t) => t.id === themeId);
}

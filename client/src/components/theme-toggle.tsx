import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div 
      className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 border"
      data-testid="container-theme-toggle"
    >
      <Sun className="h-4 w-4 text-amber-500 transition-opacity duration-150" style={{ opacity: isDark ? 0.4 : 1 }} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-amber-400"
        data-testid="switch-theme-toggle"
      />
      <Moon className="h-4 w-4 text-slate-400 transition-opacity duration-150" style={{ opacity: isDark ? 1 : 0.4 }} />
    </div>
  );
}

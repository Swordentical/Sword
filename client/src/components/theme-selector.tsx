import { useEffect, useState } from "react";
import { Check, Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { themes, getStoredTheme, setStoredTheme, applyTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { theme: mode, setTheme: setMode } = useTheme();
  const [colorTheme, setColorTheme] = useState<string>("default");

  useEffect(() => {
    const stored = getStoredTheme();
    setColorTheme(stored);
    applyTheme(stored, mode === "dark");
  }, []);

  useEffect(() => {
    applyTheme(colorTheme, mode === "dark");
  }, [mode, colorTheme]);

  const handleColorThemeChange = (themeId: string) => {
    setColorTheme(themeId);
    setStoredTheme(themeId);
    applyTheme(themeId, mode === "dark");
  };

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        data-testid="button-theme-mode-toggle"
        className="h-8 w-8"
      >
        {mode === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle dark mode</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-theme-color-selector"
            className="h-8 w-8"
          >
            <Palette className="h-4 w-4" />
            <span className="sr-only">Select color theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((theme) => {
            const isActive = colorTheme === theme.id;
            const previewColor = mode === "dark" 
              ? theme.colors.dark.primary 
              : theme.colors.light.primary;
            
            return (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleColorThemeChange(theme.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  isActive && "bg-accent"
                )}
                data-testid={`theme-option-${theme.id}`}
              >
                <div
                  className="h-5 w-5 rounded-full border border-border flex-shrink-0"
                  style={{ backgroundColor: `hsl(${previewColor})` }}
                />
                <span className="flex-1">{theme.name}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

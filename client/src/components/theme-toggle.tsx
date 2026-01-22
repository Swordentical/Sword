import { useTheme } from "@/components/theme-provider";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setThemeWithAnimation } = useTheme();
  const isLight = resolvedTheme === "light";
  const isDusk = resolvedTheme === "dusk";
  const isDark = resolvedTheme === "dark";
  const containerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      // Cycle: light -> dusk -> dark -> light
      const nextTheme = isLight ? "dusk" : isDusk ? "dark" : "light";
      setThemeWithAnimation(nextTheme, x, y);
    }
  };

  // Toggle position: light=0, dusk=center, dark=right
  const togglePosition = isLight ? "translate-x-0" : isDusk ? "translate-x-3" : "translate-x-6";

  return (
    <button
      ref={containerRef}
      onClick={handleToggle}
      className={cn(
        "relative w-12 h-6 rounded-full p-0.5 transition-all duration-500 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isLight && "bg-gradient-to-r from-sky-300 to-blue-400 shadow-[inset_0_1px_6px_rgba(255,255,255,0.3)]",
        isDusk && "bg-gradient-to-r from-orange-400 via-rose-400 to-purple-500 shadow-[inset_0_1px_6px_rgba(0,0,0,0.2)]",
        isDark && "bg-gradient-to-r from-slate-800 to-indigo-900 shadow-[inset_0_1px_6px_rgba(0,0,0,0.4)]"
      )}
      data-testid="button-theme-toggle"
      aria-label={isLight ? "Switch to dusk mode" : isDusk ? "Switch to dark mode" : "Switch to light mode"}
    >
      {/* Stars (visible in dark mode) */}
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500",
        isDark ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute top-1 left-1.5 w-[2px] h-[2px] bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="absolute top-2.5 left-3 w-[3px] h-[3px] bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>

      {/* Toggle circle with sun/sunset/moon */}
      <div
        className={cn(
          "relative w-5 h-5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          togglePosition,
          isLight && "bg-gradient-to-br from-yellow-200 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
          isDusk && "bg-gradient-to-br from-orange-300 to-rose-500 shadow-[0_0_10px_rgba(251,146,60,0.6)]",
          isDark && "bg-gradient-to-br from-slate-200 to-slate-400 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        )}
      >
        {/* Sun rays (visible in light mode) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          isLight ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
        )}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-[2px] h-1 bg-amber-500/60 rounded-full origin-center"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-8px)`,
              }}
            />
          ))}
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400" />
        </div>

        {/* Sunset glow (visible in dusk mode) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 overflow-hidden rounded-full",
          isDusk ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}>
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-orange-300 via-rose-400 to-purple-400" />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-rose-500/40 to-transparent rounded-b-full" />
        </div>

        {/* Moon craters (visible in dark mode) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 overflow-hidden rounded-full",
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
        )}>
          <div className="absolute top-1 right-1 w-1 h-1 bg-slate-300/50 rounded-full" />
          <div className="absolute bottom-1.5 right-1 w-[3px] h-[3px] bg-slate-300/40 rounded-full" />
          <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-100/20 to-transparent rounded-full" />
        </div>
      </div>

      {/* Clouds (visible in light mode) */}
      <div className={cn(
        "absolute right-1.5 top-1 transition-all duration-500",
        isLight ? "opacity-60 translate-x-0" : "opacity-0 translate-x-1"
      )}>
        <div className="w-2 h-1 bg-white rounded-full" />
      </div>
    </button>
  );
}

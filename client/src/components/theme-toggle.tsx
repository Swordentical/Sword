import { useTheme } from "@/components/theme-provider";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setThemeWithAnimation } = useTheme();
  const isDark = resolvedTheme === "dark";
  const containerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setThemeWithAnimation(isDark ? "light" : "dark", x, y);
    }
  };

  return (
    <button
      ref={containerRef}
      onClick={handleToggle}
      className={cn(
        "relative w-16 h-8 rounded-full p-1 transition-all duration-500 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isDark 
          ? "bg-gradient-to-r from-slate-800 to-indigo-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.4)]" 
          : "bg-gradient-to-r from-amber-300 to-orange-400 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]"
      )}
      data-testid="button-theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Stars (visible in dark mode) */}
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500",
        isDark ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute top-1.5 left-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="absolute top-3 left-4 w-1 h-1 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
      </div>

      {/* Toggle circle with sun/moon */}
      <div
        className={cn(
          "relative w-6 h-6 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark 
            ? "translate-x-8 bg-gradient-to-br from-slate-200 to-slate-400 shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
            : "translate-x-0 bg-gradient-to-br from-yellow-200 to-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
        )}
      >
        {/* Sun rays (visible in light mode) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          isDark ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
        )}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-0.5 h-1.5 bg-amber-500/60 rounded-full origin-center"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-10px)`,
              }}
            />
          ))}
          {/* Sun face */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400" />
        </div>

        {/* Moon craters (visible in dark mode) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 overflow-hidden rounded-full",
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
        )}>
          <div className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-slate-300/50 rounded-full" />
          <div className="absolute bottom-2 right-1 w-1 h-1 bg-slate-300/40 rounded-full" />
          <div className="absolute top-2.5 left-1.5 w-0.5 h-0.5 bg-slate-300/30 rounded-full" />
          {/* Moon glow */}
          <div className="absolute -inset-1 bg-gradient-to-br from-slate-100/20 to-transparent rounded-full" />
        </div>
      </div>

      {/* Clouds (visible in light mode) */}
      <div className={cn(
        "absolute right-1.5 top-1 transition-all duration-500",
        isDark ? "opacity-0 translate-x-2" : "opacity-60 translate-x-0"
      )}>
        <div className="w-3 h-1.5 bg-white rounded-full" />
        <div className="w-2 h-1 bg-white rounded-full -mt-0.5 ml-0.5" />
      </div>
    </button>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface TransitionState {
  isAnimating: boolean;
  originX: number;
  originY: number;
  targetTheme: "dark" | "light";
}

let transitionCallback: ((x: number, y: number, theme: "dark" | "light") => void) | null = null;

export function triggerThemeTransition(x: number, y: number, theme: "dark" | "light") {
  if (transitionCallback) {
    transitionCallback(x, y, theme);
  }
}

export function ThemeTransitionLayer() {
  const { resolvedTheme } = useTheme();
  const [transition, setTransition] = useState<TransitionState>({
    isAnimating: false,
    originX: 0,
    originY: 0,
    targetTheme: "light",
  });
  const [progress, setProgress] = useState(0);

  const startTransition = useCallback((x: number, y: number, theme: "dark" | "light") => {
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setTransition({
      isAnimating: true,
      originX: x,
      originY: y,
      targetTheme: theme,
    });
    setProgress(0);

    // Animate progress from 0 to 1 over 700ms
    const startTime = performance.now();
    const duration = 700;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        setTimeout(() => {
          setTransition((prev) => ({ ...prev, isAnimating: false }));
          setProgress(0);
        }, 50);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    transitionCallback = startTransition;
    return () => {
      transitionCallback = null;
    };
  }, [startTransition]);

  if (!transition.isAnimating) {
    return null;
  }

  // Calculate the maximum radius needed to cover the entire screen
  const maxRadius = Math.hypot(
    Math.max(transition.originX, window.innerWidth - transition.originX),
    Math.max(transition.originY, window.innerHeight - transition.originY)
  );

  const currentRadius = progress * maxRadius;
  const isDarkTransition = transition.targetTheme === "dark";

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99999 }}
      aria-hidden="true"
    >
      {/* Main transition circle */}
      <div
        className={cn(
          "absolute inset-0 transition-none",
          isDarkTransition 
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" 
            : "bg-gradient-to-br from-amber-50 via-white to-sky-50"
        )}
        style={{
          clipPath: isDarkTransition
            ? `circle(${currentRadius}px at ${transition.originX}px ${transition.originY}px)`
            : `circle(${maxRadius - currentRadius}px at ${transition.originX}px ${transition.originY}px)`,
        }}
      />

      {/* Soft edge glow for dark transition */}
      {isDarkTransition && progress > 0.1 && progress < 0.9 && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle ${currentRadius * 0.1}px at ${transition.originX}px ${transition.originY}px, transparent 80%, rgba(99, 102, 241, 0.3) 100%)`,
            clipPath: `circle(${currentRadius}px at ${transition.originX}px ${transition.originY}px)`,
          }}
        />
      )}

      {/* Warm glow edge for light transition */}
      {!isDarkTransition && progress > 0.1 && progress < 0.9 && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle ${(maxRadius - currentRadius) * 0.15}px at ${transition.originX}px ${transition.originY}px, rgba(251, 191, 36, 0.4) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Subtle vignette for dark mode */}
      {isDarkTransition && progress > 0.5 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)",
            opacity: (progress - 0.5) * 2,
            clipPath: `circle(${currentRadius}px at ${transition.originX}px ${transition.originY}px)`,
          }}
        />
      )}

      {/* Ambient grain texture (very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          clipPath: isDarkTransition
            ? `circle(${currentRadius}px at ${transition.originX}px ${transition.originY}px)`
            : undefined,
        }}
      />
    </div>
  );
}

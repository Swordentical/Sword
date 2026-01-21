import { useEffect, useState, useCallback } from "react";
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
  const [transition, setTransition] = useState<TransitionState>({
    isAnimating: false,
    originX: 0,
    originY: 0,
    targetTheme: "light",
  });
  const [progress, setProgress] = useState(0);

  const startTransition = useCallback((x: number, y: number, theme: "dark" | "light") => {
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

    const startTime = performance.now();
    const duration = 600;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
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

  const maxRadius = Math.hypot(
    Math.max(transition.originX, window.innerWidth - transition.originX),
    Math.max(transition.originY, window.innerHeight - transition.originY)
  );

  const currentRadius = progress * maxRadius;
  const isDarkTransition = transition.targetTheme === "dark";

  // Only show during the middle of the animation for a subtle ripple effect
  const rippleOpacity = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) * 3.33 : 1;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99999 }}
      aria-hidden="true"
    >
      {/* Ripple ring effect - just a subtle border ring expanding outward */}
      <div
        className="absolute rounded-full"
        style={{
          left: transition.originX - currentRadius,
          top: transition.originY - currentRadius,
          width: currentRadius * 2,
          height: currentRadius * 2,
          opacity: rippleOpacity * 0.4,
          boxShadow: isDarkTransition
            ? `inset 0 0 ${currentRadius * 0.1}px ${currentRadius * 0.05}px rgba(99, 102, 241, 0.3), 0 0 ${currentRadius * 0.05}px rgba(99, 102, 241, 0.2)`
            : `inset 0 0 ${currentRadius * 0.1}px ${currentRadius * 0.05}px rgba(251, 191, 36, 0.3), 0 0 ${currentRadius * 0.05}px rgba(251, 191, 36, 0.2)`,
        }}
      />

      {/* Soft glow at the origin point */}
      {progress > 0 && progress < 0.8 && (
        <div
          className={cn(
            "absolute rounded-full",
            isDarkTransition ? "bg-indigo-500/20" : "bg-amber-400/30"
          )}
          style={{
            left: transition.originX - 50,
            top: transition.originY - 50,
            width: 100,
            height: 100,
            filter: "blur(30px)",
            opacity: (1 - progress) * 0.8,
            transform: `scale(${1 + progress * 2})`,
          }}
        />
      )}

      {/* Very subtle ambient wash - almost invisible */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkTransition
            ? `radial-gradient(circle ${currentRadius}px at ${transition.originX}px ${transition.originY}px, rgba(30, 27, 75, 0.08) 0%, transparent 70%)`
            : `radial-gradient(circle ${currentRadius}px at ${transition.originX}px ${transition.originY}px, rgba(254, 243, 199, 0.12) 0%, transparent 70%)`,
          opacity: rippleOpacity,
        }}
      />
    </div>
  );
}

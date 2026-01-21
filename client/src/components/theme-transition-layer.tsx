import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TransitionState {
  isActive: boolean;
  originX: number;
  originY: number;
}

let transitionCallback: ((x: number, y: number) => void) | null = null;

export function triggerThemeTransition(x: number, y: number, _theme: "dark" | "light") {
  if (transitionCallback) {
    transitionCallback(x, y);
  }
}

export function ThemeTransitionLayer() {
  const [transition, setTransition] = useState<TransitionState>({
    isActive: false,
    originX: 0,
    originY: 0,
  });

  const startTransition = useCallback((x: number, y: number) => {
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Set CSS variables for the radial gradient origin
    document.documentElement.style.setProperty('--theme-origin-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-origin-y', `${y}px`);
    
    // Enable the transition class on the root
    document.documentElement.classList.add('theme-transitioning');

    setTransition({
      isActive: true,
      originX: x,
      originY: y,
    });

    // Remove the transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setTransition(prev => ({ ...prev, isActive: false }));
    }, 800);
  }, []);

  useEffect(() => {
    transitionCallback = startTransition;
    return () => {
      transitionCallback = null;
    };
  }, [startTransition]);

  // Subtle radial influence - NOT a cover, just a gentle ambient effect
  if (!transition.isActive) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {/* Subtle ambient radial glow - does NOT cover content */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          transition.isActive && "opacity-100"
        )}
        style={{
          background: `radial-gradient(
            circle 400px at ${transition.originX}px ${transition.originY}px,
            rgba(128, 128, 128, 0.08) 0%,
            transparent 70%
          )`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}

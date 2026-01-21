import { useEffect, useState, useCallback } from "react";

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
    const duration = 900;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - newProgress, 4);
      setProgress(eased);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setTransition((prev) => ({ ...prev, isAnimating: false }));
          setProgress(0);
        }, 100);
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
  ) * 1.2;

  const currentRadius = progress * maxRadius;
  const isDarkTransition = transition.targetTheme === "dark";

  const fadeIn = progress < 0.15 ? progress / 0.15 : 1;
  const fadeOut = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
  const ambientOpacity = fadeIn * fadeOut * 0.35;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          left: transition.originX,
          top: transition.originY,
          width: currentRadius * 2,
          height: currentRadius * 2,
          transform: `translate(-50%, -50%)`,
          background: isDarkTransition
            ? `radial-gradient(circle, rgba(30, 27, 75, ${ambientOpacity}) 0%, rgba(15, 10, 50, ${ambientOpacity * 0.6}) 40%, transparent 70%)`
            : `radial-gradient(circle, rgba(255, 251, 235, ${ambientOpacity}) 0%, rgba(254, 243, 199, ${ambientOpacity * 0.7}) 40%, transparent 70%)`,
          willChange: "width, height",
        }}
      />

      {progress < 0.5 && (
        <div
          className="absolute rounded-full"
          style={{
            left: transition.originX - 80,
            top: transition.originY - 80,
            width: 160,
            height: 160,
            background: isDarkTransition
              ? "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)",
            opacity: (0.5 - progress) * 2,
            transform: `scale(${1 + progress * 3})`,
            filter: "blur(20px)",
            willChange: "transform, opacity",
          }}
        />
      )}

      {isDarkTransition && progress > 0.2 && progress < 0.8 && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + progress * 0.5;
            const distance = 50 + progress * 150;
            const x = transition.originX + Math.cos(angle) * distance;
            const y = transition.originY + Math.sin(angle) * distance;
            const starOpacity = (1 - Math.abs(progress - 0.5) * 2) * 0.4;
            
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: x,
                  top: y,
                  width: 2 + Math.random(),
                  height: 2 + Math.random(),
                  opacity: starOpacity,
                  transform: "translate(-50%, -50%)",
                  willChange: "opacity",
                }}
              />
            );
          })}
        </>
      )}

      {!isDarkTransition && progress > 0.1 && progress < 0.7 && (
        <div
          className="absolute"
          style={{
            left: transition.originX - currentRadius * 0.3,
            top: transition.originY - currentRadius * 0.3,
            width: currentRadius * 0.6,
            height: currentRadius * 0.6,
            background: "radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255, 237, 213, 0.15) 0%, transparent 60%)",
            opacity: (0.7 - progress) * 1.5,
            filter: "blur(30px)",
            willChange: "opacity",
          }}
        />
      )}
    </div>
  );
}

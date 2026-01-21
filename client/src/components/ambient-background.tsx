import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTheme } from "./theme-provider";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  phase: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.4 + 0.1,
    speed: Math.random() * 0.5 + 0.2,
    phase: Math.random() * Math.PI * 2,
  }));
}

export function AmbientBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const prevThemeRef = useRef(resolvedTheme);
  const particles = useMemo(() => generateParticles(30), []);
  const [time, setTime] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (reducedMotion.current) return;
    
    let animationId: number;
    const animate = () => {
      setTime(t => t + 0.01);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    if (prevThemeRef.current !== resolvedTheme) {
      if (!reducedMotion.current) {
        setIsTransitioning(true);
        const startTime = performance.now();
        const duration = 1200;

        const animateTransition = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setTransitionProgress(eased);

          if (progress < 1) {
            requestAnimationFrame(animateTransition);
          } else {
            setTimeout(() => {
              setIsTransitioning(false);
              setTransitionProgress(0);
            }, 100);
          }
        };
        requestAnimationFrame(animateTransition);
      }
      prevThemeRef.current = resolvedTheme;
    }
  }, [resolvedTheme]);

  const radialScale = isTransitioning ? 0.5 + transitionProgress * 1.5 : 1;
  const radialOpacity = isTransitioning ? transitionProgress * 0.6 : 0;

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      <div 
        className="absolute inset-0 transition-colors duration-1000 ease-out"
        style={{
          background: isDark 
            ? "linear-gradient(135deg, #000000 0%, #0a0a0f 50%, #000000 100%)"
            : "linear-gradient(135deg, #fefefe 0%, #faf8f5 50%, #ffffff 100%)",
        }}
      />

      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isDark ? 0.15 : 0,
          background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(59, 130, 246, 0.3) 0%, transparent 60%)",
        }}
      />

      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isDark ? 0.1 : 0,
          background: "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 50%)",
        }}
      />

      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: !isDark ? 0.2 : 0,
          background: "radial-gradient(ellipse 100% 60% at 80% 0%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)",
        }}
      />

      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: !isDark ? 0.1 : 0,
          background: "radial-gradient(ellipse 80% 80% at 10% 90%, rgba(254, 215, 170, 0.2) 0%, transparent 40%)",
        }}
      />

      {isTransitioning && (
        <div 
          className="absolute transition-none"
          style={{
            top: 0,
            right: 0,
            width: "200vmax",
            height: "200vmax",
            transform: `translate(50%, -50%) scale(${radialScale})`,
            opacity: radialOpacity,
            background: isDark
              ? "radial-gradient(circle, rgba(30, 27, 75, 0.4) 0%, rgba(15, 10, 40, 0.2) 30%, transparent 60%)"
              : "radial-gradient(circle, rgba(255, 251, 235, 0.5) 0%, rgba(254, 243, 199, 0.3) 30%, transparent 60%)",
            willChange: "transform, opacity",
          }}
        />
      )}

      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        {particles.map((particle) => {
          const yOffset = Math.sin(time * particle.speed + particle.phase) * 0.3;
          const xOffset = Math.cos(time * particle.speed * 0.7 + particle.phase) * 0.2;
          const twinkle = 0.5 + Math.sin(time * 2 + particle.phase) * 0.5;
          
          return (
            <div
              key={particle.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${particle.x + xOffset}%`,
                top: `${particle.y + yOffset}%`,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity * twinkle,
                willChange: "transform, opacity",
                transform: "translateZ(0)",
              }}
            />
          );
        })}
      </div>

      <div 
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{ 
          opacity: !isDark ? 0.03 : 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export function InvisibleThemeTrigger() {
  const { resolvedTheme, setThemeWithAnimation } = useTheme();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const x = rect.right - 20;
      const y = rect.top + 20;
      setThemeWithAnimation(resolvedTheme === "dark" ? "light" : "dark", x, y);
    }
  }, [resolvedTheme, setThemeWithAnimation]);

  return (
    <div
      ref={triggerRef}
      onClick={handleClick}
      className="fixed top-0 right-0 w-20 h-20 cursor-default"
      style={{ zIndex: 50 }}
      aria-label="Toggle theme"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      data-testid="invisible-theme-trigger"
    />
  );
}

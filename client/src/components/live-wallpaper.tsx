import { useMemo } from "react";

export function LiveWallpaper() {
  const particles = useMemo(() => 
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: Math.random() * 80 + 30,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * -25,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:to-muted/10" />
      
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.02]">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      <svg className="absolute inset-0 w-full h-full opacity-[0.015] dark:opacity-[0.01]">
        <defs>
          <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" className="fill-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>

      <div className="absolute inset-0 opacity-30 dark:opacity-15">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-primary/25 to-primary/5 dark:from-primary/20 dark:to-primary/5 blur-2xl"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div 
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-primary/12 to-transparent dark:from-primary/6 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3"
        style={{ animation: "pulse-glow 8s ease-in-out infinite" }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-primary/10 to-transparent dark:from-primary/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"
        style={{ animation: "pulse-glow 10s ease-in-out infinite 2s" }}
      />
      <div 
        className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-gradient-radial from-muted/40 to-transparent dark:from-muted/20 rounded-full blur-2xl"
        style={{ animation: "pulse-glow 12s ease-in-out infinite 4s" }}
      />
      <div 
        className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] bg-gradient-radial from-primary/8 to-transparent dark:from-primary/4 rounded-full blur-3xl"
        style={{ animation: "pulse-glow 9s ease-in-out infinite 1s" }}
      />

      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% {
            transform: translate(40px, -50px) scale(1.15);
            opacity: 0.7;
          }
          50% {
            transform: translate(-30px, -80px) scale(0.85);
            opacity: 0.4;
          }
          75% {
            transform: translate(50px, -40px) scale(1.1);
            opacity: 0.6;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

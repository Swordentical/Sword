import { useTheme } from "@/components/theme-provider";

export function AnimatedBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 transition-colors duration-500"
        style={{
          backgroundColor: isDark ? 'hsl(215 25% 9%)' : 'hsl(210 20% 98%)',
        }}
      />
      
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id="grid-pattern" 
            width="40" 
            height="40" 
            patternUnits="userSpaceOnUse"
          >
            <circle 
              cx="20" 
              cy="20" 
              r="1" 
              className={`transition-all duration-500 ${isDark ? 'fill-white/5' : 'fill-primary/5'}`}
            />
          </pattern>
          
          <pattern 
            id="hex-pattern" 
            width="56" 
            height="100" 
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.5)"
          >
            <path 
              d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" 
              fill="none" 
              className={`transition-all duration-500 ${isDark ? 'stroke-white/[0.03]' : 'stroke-primary/[0.04]'}`}
              strokeWidth="1"
            />
            <path 
              d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" 
              fill="none" 
              className={`transition-all duration-500 ${isDark ? 'stroke-white/[0.02]' : 'stroke-primary/[0.03]'}`}
              strokeWidth="0.5"
            />
          </pattern>

          <linearGradient id="fade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(14, 165, 233, 0.03)'} />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor={isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(6, 182, 212, 0.03)'} />
          </linearGradient>

          <radialGradient id="glow-1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(14, 165, 233, 0.06)'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <radialGradient id="glow-2" cx="80%" cy="70%" r="40%">
            <stop offset="0%" stopColor={isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(6, 182, 212, 0.06)'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <rect width="100%" height="100%" fill="url(#fade-gradient)" />
      </svg>

      <div 
        className="absolute inset-0 animate-pulse-slow"
        style={{ animationDuration: '8s' }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="url(#glow-1)" />
        </svg>
      </div>

      <div 
        className="absolute inset-0 animate-pulse-slow"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="url(#glow-2)" />
        </svg>
      </div>

      <div className="floating-particles">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full transition-colors duration-500 ${
              isDark ? 'bg-white/[0.02]' : 'bg-primary/[0.02]'
            }`}
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${(i * 20) % 100}%`,
              top: `${(i * 15 + 10) % 100}%`,
              animation: `float-${i % 3} ${15 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 30px) scale(0.95); }
          66% { transform: translate(20px, -15px) scale(1.05); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 25px) scale(1.03); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

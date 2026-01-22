import { useTheme } from "@/components/theme-provider";
import { useAppearanceSettings } from "@/hooks/use-appearance-settings";

export type WallpaperPreset = "geometric" | "waves" | "particles" | "gradient" | "none";

interface AnimatedBackgroundProps {
  preset?: WallpaperPreset;
}

export function AnimatedBackground({ preset: propPreset }: AnimatedBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearanceSettings();
  const isDark = resolvedTheme === "dark";
  const preset = propPreset ?? settings.wallpaperPreset;

  if (preset === "none") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 transition-colors duration-500"
          style={{
            backgroundColor: isDark ? 'hsl(215 25% 9%)' : 'hsl(210 20% 98%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 transition-colors duration-500"
        style={{
          backgroundColor: isDark ? 'hsl(215 25% 9%)' : 'hsl(210 20% 98%)',
        }}
      />
      
      {preset === "geometric" && <GeometricPattern isDark={isDark} />}
      {preset === "waves" && <WavesPattern isDark={isDark} />}
      {preset === "particles" && <ParticlesPattern isDark={isDark} />}
      {preset === "gradient" && <GradientPattern isDark={isDark} />}

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
        @keyframes wave-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
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

function GeometricPattern({ isDark }: { isDark: boolean }) {
  return (
    <>
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
              r="1.5" 
              fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(14, 165, 233, 0.12)'}
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
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(14, 165, 233, 0.10)'}
              strokeWidth="1.5"
            />
            <path 
              d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" 
              fill="none" 
              stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(14, 165, 233, 0.08)'}
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="fade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(14, 165, 233, 0.08)'} />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor={isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(6, 182, 212, 0.08)'} />
          </linearGradient>

          <radialGradient id="glow-1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(14, 165, 233, 0.15)'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <radialGradient id="glow-2" cx="80%" cy="70%" r="40%">
            <stop offset="0%" stopColor={isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(6, 182, 212, 0.15)'} />
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
          <defs>
            <radialGradient id="glow-anim-1" cx="20%" cy="30%" r="40%">
              <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(14, 165, 233, 0.15)'} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#glow-anim-1)" />
        </svg>
      </div>

      <div 
        className="absolute inset-0 animate-pulse-slow"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glow-anim-2" cx="80%" cy="70%" r="40%">
              <stop offset="0%" stopColor={isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(6, 182, 212, 0.15)'} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#glow-anim-2)" />
        </svg>
      </div>

      <div className="floating-particles">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full transition-colors duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(14, 165, 233, 0.06)',
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
    </>
  );
}

function WavesPattern({ isDark }: { isDark: boolean }) {
  return (
    <>
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(14, 165, 233, 0.18)'} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(6, 182, 212, 0.15)'} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-48 opacity-60"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${isDark ? '%233b82f6' : '%230ea5e9'}' fill-opacity='0.2' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x`,
          backgroundSize: '50% 100%',
          animation: 'wave-move 20s linear infinite',
        }}
      />
      
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-32 opacity-40"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${isDark ? '%238b5cf6' : '%2306b6d4'}' fill-opacity='0.25' d='M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x`,
          backgroundSize: '50% 100%',
          animation: 'wave-move 15s linear infinite reverse',
        }}
      />

      <div 
        className="absolute inset-0 animate-pulse-slow"
        style={{ animationDuration: '6s' }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(14, 165, 233, 0.12)'} 0%, transparent 50%)`,
          }}
        />
      </div>
    </>
  );
}

function ParticlesPattern({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: isDark 
                ? `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 255, ${0.1 + Math.random() * 0.15})`
                : `rgba(14, ${140 + Math.random() * 60}, ${200 + Math.random() * 55}, ${0.15 + Math.random() * 0.2})`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-${i % 3} ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(14, 165, 233, 0.1)'} 0%, transparent 70%)`,
        }}
      />
    </>
  );
}

function GradientPattern({ isDark }: { isDark: boolean }) {
  return (
    <div 
      className="absolute inset-0"
      style={{
        background: isDark 
          ? 'linear-gradient(-45deg, rgba(30, 58, 138, 0.3), rgba(88, 28, 135, 0.2), rgba(15, 23, 42, 0.4), rgba(30, 64, 175, 0.25))'
          : 'linear-gradient(-45deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.12), rgba(255, 255, 255, 0.1), rgba(56, 189, 248, 0.18))',
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 15s ease infinite',
      }}
    />
  );
}

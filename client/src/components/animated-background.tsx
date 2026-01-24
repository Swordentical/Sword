import { useTheme } from "@/components/theme-provider";
import { useAppearanceSettings } from "@/hooks/use-appearance-settings";

export type WallpaperPreset = "geometric" | "waves" | "particles" | "gradient" | "none";

interface AnimatedBackgroundProps {
  preset?: WallpaperPreset;
}

type ThemeMode = "light" | "dusk" | "dark";

export function AnimatedBackground({ preset: propPreset }: AnimatedBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearanceSettings();
  const themeMode = resolvedTheme as ThemeMode;
  const preset = propPreset ?? settings.wallpaperPreset;

  const getBackgroundColor = () => {
    switch (themeMode) {
      case "dark": return 'hsl(220 25% 9%)';
      case "dusk": return 'hsl(25 30% 12%)';
      default: return 'hsl(200 25% 98%)';
    }
  };

  if (preset === "none") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 transition-colors duration-500"
          style={{ backgroundColor: getBackgroundColor() }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: getBackgroundColor() }}
      />
      
      {preset === "geometric" && <GeometricPattern themeMode={themeMode} />}
      {preset === "waves" && <WavesPattern themeMode={themeMode} />}
      {preset === "particles" && <ParticlesPattern themeMode={themeMode} />}
      {preset === "gradient" && <GradientPattern themeMode={themeMode} />}
      
      {settings.showFloatingElements && <FloatingDentalElements themeMode={themeMode} />}

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

function GeometricPattern({ themeMode }: { themeMode: ThemeMode }) {
  const getColor = (light: string, dusk: string, dark: string) => {
    switch (themeMode) {
      case "dark": return dark;
      case "dusk": return dusk;
      default: return light;
    }
  };

  return (
    <>
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id="grid-pattern" 
            width="60" 
            height="60" 
            patternUnits="userSpaceOnUse"
          >
            <circle 
              cx="30" 
              cy="30" 
              r="1" 
              fill={getColor('rgba(0, 188, 212, 0.08)', 'rgba(251, 146, 60, 0.08)', 'rgba(0, 188, 212, 0.06)')}
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
              stroke={getColor('rgba(0, 188, 212, 0.10)', 'rgba(251, 146, 60, 0.10)', 'rgba(0, 188, 212, 0.08)')}
              strokeWidth="1.5"
            />
            <path 
              d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" 
              fill="none" 
              stroke={getColor('rgba(156, 39, 176, 0.08)', 'rgba(251, 146, 60, 0.08)', 'rgba(156, 39, 176, 0.06)')}
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="fade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor('rgba(0, 188, 212, 0.06)', 'rgba(251, 146, 60, 0.08)', 'rgba(0, 188, 212, 0.06)')} />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor={getColor('rgba(156, 39, 176, 0.06)', 'rgba(236, 72, 153, 0.08)', 'rgba(156, 39, 176, 0.06)')} />
          </linearGradient>
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
              <stop offset="0%" stopColor={getColor('rgba(0, 188, 212, 0.12)', 'rgba(251, 146, 60, 0.12)', 'rgba(0, 188, 212, 0.10)')} />
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
              <stop offset="0%" stopColor={getColor('rgba(156, 39, 176, 0.12)', 'rgba(236, 72, 153, 0.12)', 'rgba(156, 39, 176, 0.10)')} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#glow-anim-2)" />
        </svg>
      </div>

    </>
  );
}

function FloatingDentalElements({ themeMode }: { themeMode: ThemeMode }) {
  const getColor = (light: string, dusk: string, dark: string) => {
    switch (themeMode) {
      case "dark": return dark;
      case "dusk": return dusk;
      default: return light;
    }
  };

  const dentalElements = [
    // Layer 1: Sharp foreground elements
    { type: 'tooth', size: 60, left: '4%', top: '6%', delay: 0, duration: 28, blur: 0, opacity: 0.15 },
    { type: 'tooth', size: 45, left: '90%', top: '40%', delay: 1, duration: 30, blur: 0, opacity: 0.12 },
    { type: 'enamel', size: 50, left: '85%', top: '75%', delay: 3, duration: 32, blur: 0, opacity: 0.14 },
    { type: 'curve', size: 55, left: '95%', top: '60%', delay: 9, duration: 33, blur: 0, opacity: 0.13 },
    { type: 'tooth', size: 38, left: '22%', top: '12%', delay: 11, duration: 27, blur: 0, opacity: 0.13 },
    { type: 'enamel', size: 42, left: '68%', top: '88%', delay: 13, duration: 31, blur: 0, opacity: 0.12 },
    { type: 'curve', size: 48, left: '35%', top: '5%', delay: 15, duration: 29, blur: 0, opacity: 0.11 },
    { type: 'tooth', size: 52, left: '78%', top: '22%', delay: 17, duration: 34, blur: 0, opacity: 0.14 },
    { type: 'enamel', size: 36, left: '12%', top: '65%', delay: 19, duration: 26, blur: 0, opacity: 0.13 },
    { type: 'curve', size: 44, left: '55%', top: '15%', delay: 21, duration: 30, blur: 0, opacity: 0.12 },
    
    // Layer 2: Slightly blurred mid-layer
    { type: 'tooth', size: 35, left: '15%', top: '80%', delay: 5, duration: 26, blur: 4, opacity: 0.10 },
    { type: 'enamel', size: 40, left: '2%', top: '30%', delay: 7, duration: 29, blur: 2, opacity: 0.11 },
    { type: 'curve', size: 70, left: '70%', top: '3%', delay: 6, duration: 38, blur: 6, opacity: 0.07 },
    { type: 'tooth', size: 48, left: '42%', top: '72%', delay: 12, duration: 35, blur: 3, opacity: 0.09 },
    { type: 'enamel', size: 55, left: '28%', top: '45%', delay: 14, duration: 32, blur: 5, opacity: 0.08 },
    { type: 'curve', size: 62, left: '88%', top: '55%', delay: 16, duration: 28, blur: 4, opacity: 0.10 },
    { type: 'tooth', size: 40, left: '62%', top: '35%', delay: 18, duration: 33, blur: 3, opacity: 0.09 },
    { type: 'enamel', size: 46, left: '8%', top: '92%', delay: 20, duration: 27, blur: 5, opacity: 0.08 },
    { type: 'curve', size: 58, left: '45%', top: '58%', delay: 22, duration: 36, blur: 4, opacity: 0.09 },
    { type: 'tooth', size: 44, left: '75%', top: '8%', delay: 24, duration: 31, blur: 3, opacity: 0.10 },
    
    // Layer 3: Heavily blurred background elements
    { type: 'enamel', size: 80, left: '82%', top: '8%', delay: 2, duration: 35, blur: 8, opacity: 0.08 },
    { type: 'curve', size: 100, left: '6%', top: '50%', delay: 4, duration: 25, blur: 12, opacity: 0.06 },
    { type: 'tooth', size: 90, left: '50%', top: '85%', delay: 8, duration: 40, blur: 16, opacity: 0.04 },
    { type: 'enamel', size: 95, left: '25%', top: '25%', delay: 10, duration: 42, blur: 14, opacity: 0.05 },
    { type: 'curve', size: 110, left: '65%', top: '65%', delay: 23, duration: 38, blur: 18, opacity: 0.04 },
    { type: 'tooth', size: 85, left: '38%', top: '38%', delay: 25, duration: 44, blur: 12, opacity: 0.05 },
    { type: 'enamel', size: 75, left: '92%', top: '92%', delay: 26, duration: 36, blur: 10, opacity: 0.06 },
    { type: 'curve', size: 88, left: '18%', top: '18%', delay: 27, duration: 41, blur: 14, opacity: 0.05 },
    { type: 'tooth', size: 105, left: '58%', top: '48%', delay: 28, duration: 45, blur: 20, opacity: 0.03 },
    { type: 'enamel', size: 92, left: '5%', top: '75%', delay: 29, duration: 39, blur: 16, opacity: 0.04 },
  ];

  const renderDentalElement = (type: string, size: number, color: string) => {
    switch (type) {
      case 'tooth':
        return (
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            <path 
              d="M24 6C16 6 12 12 12 18C12 24 14 28 16 32C18 36 20 40 22 42C23 43 24 43 24 43C24 43 25 43 26 42C28 40 30 36 32 32C34 28 36 24 36 18C36 12 32 6 24 6Z" 
              fill={color}
            />
          </svg>
        );
      case 'enamel':
        return (
          <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none">
            <ellipse cx="30" cy="18" rx="28" ry="16" fill={color} />
            <ellipse cx="30" cy="14" rx="18" ry="8" fill={color} style={{ opacity: 0.5 }} />
          </svg>
        );
      case 'curve':
        return (
          <svg width={size} height={size * 0.5} viewBox="0 0 80 40" fill="none">
            <path 
              d="M4 36C4 36 20 4 40 4C60 4 76 36 76 36" 
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {dentalElements.map((el, i) => (
        <div
          key={i}
          className="absolute transition-all duration-500"
          style={{
            left: el.left,
            top: el.top,
            opacity: el.opacity,
            filter: el.blur > 0 ? `blur(${el.blur}px)` : 'none',
            animation: `dental-float-${i % 3} ${el.duration}s ease-in-out infinite`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {renderDentalElement(
            el.type, 
            el.size, 
            getColor('rgb(0, 188, 212)', 'rgb(251, 146, 60)', 'rgb(0, 188, 212)')
          )}
        </div>
      ))}

      <style>{`
        @keyframes dental-float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes dental-float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes dental-float-2 {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          33% { transform: translateX(6px) translateY(-6px); }
          66% { transform: translateX(-4px) translateY(-10px); }
        }
      `}</style>
    </>
  );
}

function WavesPattern({ themeMode }: { themeMode: ThemeMode }) {
  const getWaveColor = () => {
    switch (themeMode) {
      case "dark": return '%2300bcd4';
      case "dusk": return '%23fb923c';
      default: return '%2300bcd4';
    }
  };

  const getWaveColor2 = () => {
    switch (themeMode) {
      case "dark": return '%239c27b0';
      case "dusk": return '%23ec4899';
      default: return '%239c27b0';
    }
  };

  const getGlowColor = () => {
    switch (themeMode) {
      case "dark": return 'rgba(0, 188, 212, 0.1)';
      case "dusk": return 'rgba(251, 146, 60, 0.12)';
      default: return 'rgba(0, 188, 212, 0.12)';
    }
  };

  return (
    <>
      <svg 
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getGlowColor()} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-48 opacity-60"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${getWaveColor()}' fill-opacity='0.2' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x`,
          backgroundSize: '50% 100%',
          animation: 'wave-move 20s linear infinite',
        }}
      />
      
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-32 opacity-40"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${getWaveColor2()}' fill-opacity='0.25' d='M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x`,
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
            background: `radial-gradient(ellipse at 30% 20%, ${getGlowColor()} 0%, transparent 50%)`,
          }}
        />
      </div>
    </>
  );
}

function ParticlesPattern({ themeMode }: { themeMode: ThemeMode }) {
  const getParticleColor = (i: number) => {
    switch (themeMode) {
      case "dark": 
        return `rgba(0, ${150 + (i * 17) % 50}, ${180 + (i * 23) % 40}, ${0.1 + (i % 5) * 0.03})`;
      case "dusk": 
        return `rgba(${200 + (i * 13) % 55}, ${100 + (i * 19) % 100}, ${50 + (i * 7) % 100}, ${0.12 + (i % 5) * 0.03})`;
      default: 
        return `rgba(0, ${150 + (i * 11) % 50}, ${180 + (i * 7) % 40}, ${0.15 + (i % 5) * 0.04})`;
    }
  };

  const getGlowColor = () => {
    switch (themeMode) {
      case "dark": return 'rgba(0, 188, 212, 0.08)';
      case "dusk": return 'rgba(251, 146, 60, 0.10)';
      default: return 'rgba(0, 188, 212, 0.1)';
    }
  };

  return (
    <>
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: getParticleColor(i),
              width: `${4 + (i % 3) * 4}px`,
              height: `${4 + (i % 3) * 4}px`,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 29) % 100}%`,
              animation: `float-${i % 3} ${10 + (i % 10) * 2}s ease-in-out infinite`,
              animationDelay: `${(i % 10)}s`,
            }}
          />
        ))}
      </div>

      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${getGlowColor()} 0%, transparent 70%)`,
        }}
      />
    </>
  );
}

function GradientPattern({ themeMode }: { themeMode: ThemeMode }) {
  const getGradient = () => {
    switch (themeMode) {
      case "dark": 
        return 'linear-gradient(-45deg, rgba(0, 188, 212, 0.2), rgba(33, 150, 243, 0.15), rgba(156, 39, 176, 0.2), rgba(0, 188, 212, 0.15))';
      case "dusk": 
        return 'linear-gradient(-45deg, rgba(251, 146, 60, 0.25), rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.15), rgba(249, 115, 22, 0.2))';
      default: 
        return 'linear-gradient(-45deg, rgba(0, 188, 212, 0.12), rgba(33, 150, 243, 0.1), rgba(156, 39, 176, 0.1), rgba(0, 188, 212, 0.15))';
    }
  };

  return (
    <div 
      className="absolute inset-0"
      style={{
        background: getGradient(),
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 15s ease infinite',
      }}
    />
  );
}

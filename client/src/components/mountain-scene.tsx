import { useTheme } from "@/components/theme-provider";

export function MountainScene() {
  const { resolvedTheme } = useTheme();
  
  const isDay = resolvedTheme === "light";
  const isDusk = resolvedTheme === "dusk";
  const isNight = resolvedTheme === "dark";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full"
        style={{ minWidth: '100%' }}
      >
        <defs>
          <linearGradient id="sky-day" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="50%" stopColor="#98D8E8" />
            <stop offset="100%" stopColor="#B8E6F0" />
          </linearGradient>
          
          <linearGradient id="sky-dusk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="30%" stopColor="#2d3561" />
            <stop offset="60%" stopColor="#734b6d" />
            <stop offset="85%" stopColor="#d4837a" />
            <stop offset="100%" stopColor="#f4a460" />
          </linearGradient>
          
          <linearGradient id="sky-night" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0a1a" />
            <stop offset="40%" stopColor="#1a1a3a" />
            <stop offset="100%" stopColor="#2a2a4a" />
          </linearGradient>
          
          <linearGradient id="sun-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
          
          <linearGradient id="moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="100%" stopColor="#E8E8E8" />
          </linearGradient>
          
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="moon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <rect
          x="0"
          y="0"
          width="1200"
          height="200"
          className="transition-all duration-1000 ease-in-out"
          fill={isDay ? "url(#sky-day)" : isDusk ? "url(#sky-dusk)" : "url(#sky-night)"}
        />
        
        <g className="stars">
          {[
            { cx: 100, cy: 25, r: 1.5, delay: 0 },
            { cx: 200, cy: 40, r: 1, delay: 0.2 },
            { cx: 300, cy: 15, r: 1.2, delay: 0.4 },
            { cx: 400, cy: 50, r: 0.8, delay: 0.1 },
            { cx: 500, cy: 30, r: 1.3, delay: 0.3 },
            { cx: 650, cy: 20, r: 1, delay: 0.5 },
            { cx: 750, cy: 45, r: 1.4, delay: 0.15 },
            { cx: 850, cy: 25, r: 0.9, delay: 0.35 },
            { cx: 950, cy: 55, r: 1.1, delay: 0.25 },
            { cx: 1050, cy: 35, r: 1.2, delay: 0.45 },
            { cx: 1100, cy: 15, r: 0.8, delay: 0.55 },
            { cx: 150, cy: 60, r: 1, delay: 0.6 },
            { cx: 350, cy: 65, r: 0.7, delay: 0.7 },
            { cx: 550, cy: 55, r: 1.1, delay: 0.8 },
            { cx: 800, cy: 60, r: 0.9, delay: 0.9 },
            { cx: 1000, cy: 50, r: 1, delay: 0.65 },
          ].map((star, i) => (
            <circle
              key={i}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill="white"
              className="transition-all duration-1000 ease-in-out"
              style={{
                opacity: isNight ? 1 : 0,
                transform: isNight ? 'scale(1)' : 'scale(0)',
                transformOrigin: `${star.cx}px ${star.cy}px`,
                animation: isNight ? `twinkle 2s ease-in-out infinite ${star.delay}s` : 'none',
              }}
            />
          ))}
        </g>
        
        <g
          className="transition-all duration-1000 ease-in-out"
          style={{
            opacity: isNight ? 1 : 0,
            transform: isNight ? 'translateY(0)' : 'translateY(50px)',
          }}
        >
          <circle
            cx="900"
            cy="50"
            r="28"
            fill="url(#moon-gradient)"
            filter="url(#moon-glow)"
          />
          <circle cx="890" cy="42" r="4" fill="#D8D8D8" opacity="0.5" />
          <circle cx="908" cy="55" r="6" fill="#D8D8D8" opacity="0.4" />
          <circle cx="895" cy="60" r="3" fill="#D8D8D8" opacity="0.3" />
        </g>
        
        <g
          className="transition-all duration-1000 ease-in-out"
          style={{
            opacity: isDay || isDusk ? 1 : 0,
            transform: isDay 
              ? 'translateY(0)' 
              : isDusk 
                ? 'translateY(60px)' 
                : 'translateY(120px)',
          }}
        >
          <circle
            cx="600"
            cy="45"
            r="35"
            fill="url(#sun-gradient)"
            filter="url(#sun-glow)"
            className="transition-all duration-1000"
            style={{
              fill: isDusk ? '#FF6B4A' : undefined,
            }}
          />
        </g>
        
        <path
          d="M0,200 L0,140 Q100,160 200,130 Q280,110 350,125 Q420,140 480,115 Q530,95 600,100 Q670,105 720,115 Q780,125 850,110 Q930,90 1000,120 Q1080,145 1150,130 Q1180,125 1200,135 L1200,200 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#6B8E6B' : isDusk ? '#4A5568' : '#2D3748',
            opacity: 0.4,
          }}
        />
        
        <path
          d="M0,200 L0,150 Q80,130 150,145 Q220,160 300,140 Q380,120 450,135 Q520,150 600,130 Q680,110 750,130 Q820,150 900,135 Q980,120 1050,140 Q1120,160 1200,145 L1200,200 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#4A7C4A' : isDusk ? '#3D4852' : '#1A202C',
            opacity: 0.6,
          }}
        />
        
        <path
          d="M0,200 L0,160 Q60,175 120,165 Q180,155 250,168 Q320,180 400,160 Q480,140 560,155 Q640,170 720,155 Q800,140 880,160 Q960,180 1040,165 Q1100,155 1140,165 Q1170,175 1200,168 L1200,200 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#3D6B3D' : isDusk ? '#2D3748' : '#171923',
            opacity: 0.8,
          }}
        />
        
        <path
          d="M0,200 L0,175 Q50,185 100,178 Q160,170 220,180 Q280,190 350,175 Q420,160 500,172 Q580,185 660,175 Q740,165 820,178 Q900,190 980,175 Q1040,165 1100,178 Q1150,188 1200,180 L1200,200 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#2D5A2D' : isDusk ? '#1A202C' : '#0D1117',
          }}
        />
      </svg>
      
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

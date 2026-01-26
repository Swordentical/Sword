import { useTheme } from "@/components/theme-provider";

export function MountainScene() {
  const { resolvedTheme } = useTheme();
  
  const isDay = resolvedTheme === "light";
  const isDusk = resolvedTheme === "dusk";
  const isNight = resolvedTheme === "dark";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          background: isDay 
            ? 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 50%, #B8E6F0 100%)'
            : isDusk 
              ? 'linear-gradient(to bottom, #1a1a2e 0%, #2d3561 30%, #734b6d 60%, #d4837a 85%, #f4a460 100%)'
              : 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a3a 40%, #2a2a4a 100%)',
        }}
      />
      
      {isNight && (
        <div className="absolute inset-0" style={{ top: '5%', bottom: '45%' }}>
          {[
            { left: '8%', top: '15%', size: 2, delay: 0 },
            { left: '15%', top: '35%', size: 1.5, delay: 0.3 },
            { left: '22%', top: '10%', size: 1.8, delay: 0.5 },
            { left: '30%', top: '45%', size: 1.2, delay: 0.2 },
            { left: '38%', top: '25%', size: 2, delay: 0.7 },
            { left: '45%', top: '55%', size: 1.5, delay: 0.4 },
            { left: '52%', top: '12%', size: 1.8, delay: 0.6 },
            { left: '60%', top: '40%', size: 1.2, delay: 0.1 },
            { left: '68%', top: '20%', size: 2, delay: 0.8 },
            { left: '75%', top: '50%', size: 1.5, delay: 0.9 },
            { left: '82%', top: '30%', size: 1.8, delay: 0.35 },
            { left: '90%', top: '42%', size: 1.2, delay: 0.65 },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white transition-opacity duration-1000"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: isNight ? 1 : 0,
                animation: `twinkle-star 2s ease-in-out infinite ${star.delay}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {isNight && (
        <div 
          className="absolute transition-all duration-1000 ease-in-out"
          style={{
            right: '12%',
            top: '12%',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
            boxShadow: '0 0 12px 3px rgba(255,255,255,0.2)',
            opacity: isNight ? 1 : 0,
            transform: isNight ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(15px)',
          }}
        >
          <div className="absolute w-1 h-1 rounded-full bg-gray-300/50" style={{ left: '25%', top: '20%' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-gray-300/40" style={{ left: '55%', top: '45%' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-gray-300/30" style={{ left: '30%', top: '60%' }} />
        </div>
      )}
      
      {(isDay || isDusk) && (
        <div 
          className="absolute transition-all duration-1000 ease-in-out"
          style={{
            left: '50%',
            marginLeft: '-14px',
            top: isDay ? '10%' : '20%',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isDusk 
              ? 'linear-gradient(to bottom, #FF6B4A 0%, #FF8C42 100%)'
              : 'linear-gradient(to bottom, #FFE066 0%, #FFA500 100%)',
            boxShadow: isDusk 
              ? '0 0 20px 6px rgba(255,107,74,0.3)'
              : '0 0 20px 6px rgba(255,200,100,0.35)',
            opacity: (isDay || isDusk) ? 1 : 0,
            transform: isDay 
              ? 'translateY(0) scale(1)' 
              : isDusk 
                ? 'translateY(0) scale(0.9)' 
                : 'translateY(40px) scale(0.5)',
          }}
        />
      )}
      
      <svg
        viewBox="0 0 1000 50"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 w-full h-1/2"
      >
        <path
          d="M0,50 L0,35 Q60,42 120,32 Q200,22 280,30 Q360,38 440,25 Q520,12 600,20 Q680,28 760,18 Q840,8 920,22 Q960,30 1000,25 L1000,50 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#6B8E6B' : isDusk ? '#4A5568' : '#2D3748',
            opacity: 0.4,
          }}
        />
        
        <path
          d="M0,50 L0,38 Q50,44 110,35 Q180,26 260,34 Q340,42 420,30 Q500,18 580,28 Q660,38 740,28 Q820,18 900,32 Q950,40 1000,35 L1000,50 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#4A7C4A' : isDusk ? '#3D4852' : '#1A202C',
            opacity: 0.6,
          }}
        />
        
        <path
          d="M0,50 L0,42 Q40,48 100,40 Q170,32 250,40 Q330,48 410,38 Q490,28 570,36 Q650,44 730,36 Q810,28 890,38 Q950,44 1000,40 L1000,50 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#3D6B3D' : isDusk ? '#2D3748' : '#171923',
            opacity: 0.8,
          }}
        />
        
        <path
          d="M0,50 L0,46 Q30,50 80,45 Q140,40 220,46 Q300,50 380,44 Q460,38 540,44 Q620,50 700,44 Q780,38 860,46 Q940,50 1000,46 L1000,50 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#2D5A2D' : isDusk ? '#1A202C' : '#0D1117',
          }}
        />
      </svg>
      
      <style>{`
        @keyframes twinkle-star {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}

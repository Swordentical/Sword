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
        <div className="absolute inset-0" style={{ top: '5%', bottom: '50%' }}>
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
      
      <div 
        className="absolute transition-all duration-1000 ease-in-out"
        style={{
          right: '15%',
          top: isNight ? '8%' : 'calc(100% - 30px)',
          width: '48px',
          height: '48px',
          opacity: isNight ? 1 : 0,
          transform: isNight ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(15deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8E8E8 0%, #D0D0D0 100%)',
            boxShadow: '0 0 20px 6px rgba(255,255,255,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: isNight 
              ? 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a3a 40%, #2a2a4a 100%)'
              : isDusk 
                ? 'linear-gradient(to bottom, #1a1a2e 0%, #2d3561 30%, #734b6d 60%, #d4837a 85%, #f4a460 100%)'
                : 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 50%, #B8E6F0 100%)',
            top: '-5px',
            left: '18px',
            transition: 'background 1000ms ease-in-out',
          }}
        />
      </div>
      
      <div 
        className="absolute transition-all duration-1000 ease-in-out"
        style={{
          left: '50%',
          marginLeft: '-28px',
          top: isDay ? '5%' : isDusk ? 'calc(100% - 85px)' : 'calc(100% + 20px)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isDusk 
            ? 'linear-gradient(to bottom, #FF4500 0%, #FF6B4A 50%, #FF8C42 100%)'
            : 'linear-gradient(to bottom, #FFE066 0%, #FFD700 50%, #FFA500 100%)',
          boxShadow: isDusk 
            ? '0 0 40px 15px rgba(255,69,0,0.4), 0 0 80px 30px rgba(255,107,74,0.2)'
            : '0 0 40px 15px rgba(255,215,0,0.4), 0 0 80px 30px rgba(255,200,100,0.2)',
          opacity: (isDay || isDusk) ? 1 : 0,
          transform: isDay 
            ? 'translateY(0) scale(1)' 
            : isDusk 
              ? 'translateY(0) scale(1.1)' 
              : 'translateY(0) scale(0.8)',
        }}
      />
      
      <svg
        viewBox="0 0 1000 70"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 w-full h-3/5"
      >
        <path
          d="M0,70 L0,50 
             Q30,52 60,48 L100,30 L140,45 Q180,50 220,46 
             L280,20 L320,38 Q360,44 400,40 
             L440,25 L480,42 Q520,48 560,44 
             L620,15 L680,35 Q720,42 760,38 
             L800,22 L840,40 Q880,46 920,42 
             L960,28 L1000,45 L1000,70 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#5A7A5A' : isDusk ? '#3D4852' : '#252D38',
            opacity: 0.5,
          }}
        />
        
        <path
          d="M0,70 L0,55 
             Q20,56 50,52 L90,35 L130,48 Q170,54 210,50 
             L260,28 L310,44 Q350,50 390,46 
             L450,22 L500,40 Q540,48 580,44 
             L630,25 L690,42 Q730,48 770,44 
             L820,30 L870,46 Q910,52 950,48 
             L1000,38 L1000,70 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#4A6B4A' : isDusk ? '#2D3748' : '#1A202C',
            opacity: 0.7,
          }}
        />
        
        <path
          d="M0,70 L0,58 
             Q25,60 60,55 L100,42 L150,54 Q190,58 230,54 
             L280,38 L340,52 Q380,58 420,54 
             L470,35 L530,50 Q570,56 610,52 
             L660,40 L720,54 Q760,58 800,54 
             L850,42 L910,55 Q950,60 1000,55 L1000,70 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#3A5C3A' : isDusk ? '#1F2937' : '#131A22',
            opacity: 0.85,
          }}
        />
        
        <path
          d="M0,70 L0,62 
             Q30,64 70,60 L110,52 L160,62 Q200,66 240,62 
             L290,50 L350,62 Q390,66 430,62 
             L480,48 L540,60 Q580,66 620,62 
             L670,52 L730,63 Q770,66 810,62 
             L860,54 L920,64 Q960,68 1000,62 L1000,70 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#2D4A2D' : isDusk ? '#151D26' : '#0D1117',
          }}
        />
        
        <path
          d="M0,70 L0,65 
             Q40,67 90,64 L140,58 L200,66 Q250,68 300,65 
             L360,56 L420,66 Q470,69 520,65 
             L580,58 L640,66 Q690,69 740,65 
             L800,60 L860,67 Q910,70 960,66 L1000,68 L1000,70 Z"
          className="transition-all duration-1000 ease-in-out"
          style={{
            fill: isDay ? '#1F3D1F' : isDusk ? '#0F1419' : '#080B0E',
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

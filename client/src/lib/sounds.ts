let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

const STORAGE_KEY = "dental-clinic-appearance";

function isSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.soundEnabled !== false;
    }
    return true;
  } catch {
    return true;
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silent fail if audio context is not available
  }
}

function playChord(frequencies: number[], duration: number, type: OscillatorType = "sine", volume: number = 0.05) {
  if (!isSoundEnabled()) return;
  
  frequencies.forEach(freq => {
    playTone(freq, duration, type, volume);
  });
}

export const sounds = {
  hover: () => playTone(800, 0.05, "sine", 0.02),
  
  click: () => playTone(600, 0.08, "triangle", 0.04),
  
  tabChange: () => {
    playTone(440, 0.1, "sine", 0.03);
    setTimeout(() => playTone(660, 0.1, "sine", 0.03), 50);
  },
  
  celebration: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "sine", 0.06), i * 100);
    });
    setTimeout(() => playChord([523, 659, 784], 0.4, "sine", 0.05), 400);
  },
  
  gameStart: () => {
    playTone(440, 0.1, "square", 0.03);
    setTimeout(() => playTone(554, 0.1, "square", 0.03), 100);
    setTimeout(() => playTone(659, 0.15, "square", 0.03), 200);
  },
  
  gameOver: () => {
    playTone(300, 0.15, "sawtooth", 0.04);
    setTimeout(() => playTone(250, 0.15, "sawtooth", 0.04), 150);
    setTimeout(() => playTone(200, 0.3, "sawtooth", 0.04), 300);
  },
  
  jump: () => playTone(400, 0.1, "square", 0.03),
  
  score: () => playTone(880, 0.08, "sine", 0.03),
  
  arcadeOpen: () => {
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "sine", 0.05), i * 80);
    });
  },
  
  arcadeClose: () => {
    playTone(400, 0.1, "sine", 0.03);
    setTimeout(() => playTone(300, 0.15, "sine", 0.03), 80);
  },
  
  menuHover: () => playTone(600, 0.04, "sine", 0.015),
  
  menuSelect: () => {
    playTone(500, 0.08, "triangle", 0.04);
    setTimeout(() => playTone(700, 0.1, "triangle", 0.04), 60);
  },
  
  lineClear: () => {
    playTone(600, 0.08, "sine", 0.04);
    setTimeout(() => playTone(800, 0.1, "sine", 0.04), 80);
  },
  
  collision: () => playTone(200, 0.15, "sawtooth", 0.04),
};

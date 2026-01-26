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

// Piano-like sound with quick attack and natural decay
function playPianoNote(frequency: number, duration: number, volume: number = 0.08) {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // Main tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Mix oscillators for richer piano-like timbre
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Fundamental + harmonics for piano character
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(frequency, now);
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(frequency * 2, now); // 2nd harmonic
    
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(frequency * 3, now); // 3rd harmonic
    
    // Piano envelope: quick attack, gradual decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  } catch {
    // Silent fail
  }
}

// Violin-like sound with slow attack, vibrato, and sustained tone
function playViolinNote(frequency: number, duration: number, volume: number = 0.06) {
  if (!isSoundEnabled()) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // Main oscillator for violin
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Vibrato LFO
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Sawtooth for bowed string character
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, now);
    
    // Vibrato settings
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(5, now); // 5Hz vibrato rate
    vibratoGain.gain.setValueAtTime(0, now);
    vibratoGain.gain.linearRampToValueAtTime(frequency * 0.02, now + 0.2); // Gentle vibrato
    
    // Violin envelope: slow bow attack, sustained, gradual release
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.15); // Slow bow attack
    gainNode.gain.setValueAtTime(volume, now + duration * 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    vibrato.start(now);
    osc.start(now);
    vibrato.stop(now + duration);
    osc.stop(now + duration);
  } catch {
    // Silent fail
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
  
  // Theme-specific sounds using piano and violin
  themeDay: () => {
    // Bright, ascending piano arpeggio - like morning sunshine
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 - major ascending
    notes.forEach((freq, i) => {
      setTimeout(() => playPianoNote(freq, 0.6, 0.06), i * 120);
    });
    // Final bright chord
    setTimeout(() => {
      playPianoNote(523, 0.8, 0.04);
      playPianoNote(659, 0.8, 0.04);
      playPianoNote(784, 0.8, 0.04);
    }, 500);
  },
  
  themeDusk: () => {
    // Warm violin melody - transitional sunset feeling
    const notes = [440, 392, 349, 330]; // A4, G4, F4, E4 - warm descending
    notes.forEach((freq, i) => {
      setTimeout(() => playViolinNote(freq, 0.5, 0.05), i * 150);
    });
    // Soft piano undertone
    setTimeout(() => playPianoNote(262, 0.8, 0.03), 200);
    setTimeout(() => playPianoNote(330, 0.8, 0.03), 400);
  },
  
  themeNight: () => {
    // Gentle violin with soft piano - calm night atmosphere
    playViolinNote(262, 0.8, 0.04); // C4 - low, calming
    setTimeout(() => playViolinNote(294, 0.7, 0.035), 300); // D4
    setTimeout(() => playViolinNote(262, 0.9, 0.04), 600); // Back to C4
    // Soft piano notes underneath
    setTimeout(() => playPianoNote(196, 1.0, 0.025), 100); // G3 - deep
    setTimeout(() => playPianoNote(247, 1.0, 0.025), 500); // B3
  },
};

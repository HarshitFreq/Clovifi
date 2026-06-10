import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playClick: () => void;
  playSuccess: () => void;
  playWarning: () => void;
  playNavigate: () => void;
  spawnBubble: (x: number, y: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem("soundEnabled");
    return saved === null ? true : saved === "true";
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("soundEnabled", enabled.toString());
  };

  // Helper to get or create audio context
  const getAudioContext = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    // Resume context if suspended (browser security)
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const playClick = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTick = (time: number, freq: number, vol: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + dur);
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + dur);
    };

    // Soft single button tick
    playTick(now, 900, 0.035, 0.025);
  };

  const playNavigate = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTick = (time: number, freq: number, vol: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + dur);
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + dur);
    };

    // Windows Explorer "Start Navigation" double-click sound:
    // First high-freq short tick, then lower-freq slightly longer tick 35ms later.
    playTick(now, 2200, 0.018, 0.012);
    playTick(now + 0.035, 1300, 0.022, 0.018);
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playBell = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, startTime);

      // soft attack and decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Ascending arpeggio chime (Vista/7 styling)
    playBell(659.25, now, 0.4);       // E5
    playBell(880.00, now + 0.08, 0.4); // A5
    playBell(1108.73, now + 0.16, 0.4); // C#6
    playBell(1318.51, now + 0.24, 0.5); // E6
  };

  const playWarning = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTone = (freq: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    };

    // Soft warning chord
    playTone(220.00, 0.05); // A3
    playTone(277.18, 0.05); // C#4
    playTone(329.63, 0.05); // E4
  };

  const spawnBubble = (x: number, y: number) => {
    const bubble = document.createElement("div");
    bubble.className = "aero-bubble-particle";
    
    // Random size between 12px and 24px
    const size = Math.floor(Math.random() * 12) + 12;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    
    // Position centered on coordinates
    bubble.style.left = `${x - size / 2}px`;
    bubble.style.top = `${y - size / 2}px`;

    // Random slight horizontal drift
    const driftX = (Math.random() - 0.5) * 45;
    bubble.style.setProperty("--drift-x", `${driftX}px`);

    document.body.appendChild(bubble);

    // Remove element after animation ends
    setTimeout(() => {
      if (document.body.contains(bubble)) {
        document.body.removeChild(bubble);
      }
    }, 500);
  };

  // Add a global click interceptor
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if target or parent is a button or clickable link
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, [role='button'], .clickable, .currency-btn");
      if (interactive) {
        // Resume context inside user gesture
        getAudioContext();

        // play sound
        const isNav = interactive.tagName === "A" || interactive.closest("nav") || interactive.classList.contains("nav-item-hover") || interactive.classList.contains("nav-active");
        if (isNav) {
          playNavigate();
        } else {
          playClick();
        }
      }
    };

    window.addEventListener("click", handleGlobalClick, true);
    return () => {
      window.removeEventListener("click", handleGlobalClick, true);
    };
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, playClick, playSuccess, playWarning, playNavigate, spawnBubble }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundEffects() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundEffects must be used within a SoundProvider");
  }
  return context;
}

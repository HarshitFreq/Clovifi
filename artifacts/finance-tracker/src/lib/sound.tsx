import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundPack: string;
  setSoundPack: (pack: string) => void;
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

  const [soundPack, setSoundPackState] = useState<string>(() => {
    return localStorage.getItem("clovifi_sound_pack") || "aero";
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("soundEnabled", enabled.toString());
  };

  const setSoundPack = (pack: string) => {
    setSoundPackState(pack);
    localStorage.setItem("clovifi_sound_pack", pack);
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

    if (soundPack === "arcade") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(950, now + 0.03);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (soundPack === "subtle") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.008, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.012);
    } else {
      // aero
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
      playTick(now, 900, 0.035, 0.025);
    }
  };

  const playNavigate = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (soundPack === "arcade") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (soundPack === "subtle") {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(2000, now);
      gain1.gain.setValueAtTime(0.008, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.008);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1600, now + 0.02);
      gain2.gain.setValueAtTime(0.008, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.028);
    } else {
      // aero
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
      playTick(now, 2200, 0.018, 0.012);
      playTick(now + 0.035, 1300, 0.022, 0.018);
    }
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (soundPack === "arcade") {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.015, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(987.77, now, 0.08);
      playTone(1318.51, now + 0.08, 0.25);
    } else if (soundPack === "subtle") {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.012, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(880.00, now, 0.12);
      playTone(1760.00, now + 0.04, 0.18);
    } else {
      // aero
      const playBell = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playBell(659.25, now, 0.4);       // E5
      playBell(880.00, now + 0.08, 0.4); // A5
      playBell(1108.73, now + 0.16, 0.4); // C#6
      playBell(1318.51, now + 0.24, 0.5); // E6
    }
  };

  const playWarning = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (soundPack === "arcade") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.35);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (soundPack === "subtle") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // aero
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
      playTone(220.00, 0.05); // A3
      playTone(277.18, 0.05); // C#4
      playTone(329.63, 0.05); // E4
    }
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
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, [role='button'], .clickable, .currency-btn");
      if (interactive) {
        getAudioContext();

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
  }, [soundEnabled, soundPack]); // Re-run click listener when soundPack changes

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, soundPack, setSoundPack, playClick, playSuccess, playWarning, playNavigate, spawnBubble }}>
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

import React, { useState, useEffect, useRef } from "react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { KeyRound, UserPlus, AlertCircle, Eye, EyeOff, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const handleMockGoogleLogin = async () => {
    setError(null);
    try {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const r = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: `google_oauth_${randomId}`,
          email: `google.user.${randomId}@gmail.com`,
          username: `GoogleUser${randomId}`,
        }),
      });

      if (!r.ok) {
        const body = await r.json();
        throw new Error(body.error || "Google Sign-In failed");
      }

      toast({
        title: "Welcome!",
        description: "Logged in successfully with Google (Simulated)",
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Google login simulation failed.");
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-transparent", width: "0%" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score, label: "Weak", color: "#ef4444", width: "25%" };
      case 2: return { score, label: "Fair", color: "#f97316", width: "50%" };
      case 3: return { score, label: "Good", color: "#eab308", width: "75%" };
      case 4: return { score, label: "Strong", color: "#22c55e", width: "100%" };
      default: return { score: 0, label: "Weak", color: "#ef4444", width: "25%" };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 alphanumeric characters.");
      return;
    }
    if (isRegister) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        setError("Password must contain at least one uppercase letter, one number, and one special character.");
        return;
      }
    } else {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    try {
      if (isRegister) {
        await registerMutation.mutateAsync({
          data: { username: cleanUsername, password }
        });
        toast({
          title: "Registration successful!",
          description: `Welcome to Clovifi, ${cleanUsername}!`,
        });
        onSuccess();
      } else {
        await loginMutation.mutateAsync({
          data: { username: cleanUsername, password }
        });
        toast({
          title: "Welcome back!",
          description: `Logged in as ${cleanUsername}`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Check your inputs.");
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden" 
      style={{ background: "#020A04", fontFamily: "'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Background Glow Spheres ── */}
      <div 
        style={{
          position: "fixed",
          width: "45vw",
          height: "45vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(125,218,42,0.08) 0%, transparent 70%)",
          top: "-10%",
          left: "-10%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div 
        style={{
          position: "fixed",
          width: "55vw",
          height: "55vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(76,175,80,0.06) 0%, transparent 70%)",
          bottom: "-15%",
          right: "-10%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── LEFT SIDE: BRANDING & HOLOGRAMS ── */}
      <div 
        className="hidden md:flex flex-1 relative flex-col justify-between p-12 md:p-20 z-10 border-r border-[rgba(125,218,42,0.08)]"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(12,38,10,0.4) 0%, transparent 80%)"
        }}
      >
        {/* Particle Canvas & Grid overlay */}
        <ParticleCanvas />
        <div 
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            perspective: "250px",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div 
            style={{
              width: "200%",
              height: "200%",
              marginLeft: "-50%",
              transform: "rotateX(65deg)",
              backgroundImage: "linear-gradient(rgba(125,218,42,0.08) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(125,218,42,0.08) 1.5px, transparent 1.5px)",
              backgroundSize: "40px 40px",
              maskImage: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9) 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9) 80%)",
            }}
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center gap-3">
          {/* Custom Glossy Clover Icon */}
          <div 
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(125,218,42,0.2) 0%, rgba(10,30,5,0.8) 100%)",
              border: "1px solid rgba(125,218,42,0.4)",
              boxShadow: "0 0 15px rgba(125,218,42,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(5px)",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="cloverGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#A8FF60" />
                  <stop offset="30%" stopColor="#7DDA2A" />
                  <stop offset="85%" stopColor="#1b5a04" />
                  <stop offset="100%" stopColor="#0b3002" />
                </radialGradient>
                <path id="leaf" d="M 16 16 C 13.5 12.5, 10.5 11, 10.5 7.8 C 10.5 4.8, 13.2 4.8, 16 8 C 18.8 4.8, 21.5 4.8, 21.5 7.8 C 21.5 11, 18.5 12.5, 16 16 Z" />
              </defs>
              <use href="#leaf" fill="url(#cloverGrad)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(90 16 16)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(180 16 16)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(270 16 16)" />
              <circle cx="16" cy="16" r="2.2" fill="#fff" opacity="0.3" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span 
              className="text-2xl font-extrabold tracking-wide text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to bottom, #ffffff 0%, #A8FF60 100%)",
                filter: "drop-shadow(0 0 8px rgba(125,218,42,0.3))",
              }}
            >
              Clovifi
            </span>
            <span style={{ fontSize: "0.65rem", color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>Fintech System</span>
          </div>
        </div>

        {/* Center Hologram Chart Section */}
        <div className="my-auto flex flex-col gap-8 relative z-10" style={{ maxWidth: "460px" }}>
          <div>
            <span 
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#7DDA2A",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                background: "rgba(125,218,42,0.1)",
                padding: "4px 10px",
                borderRadius: "20px",
                border: "1px solid rgba(125,218,42,0.2)",
              }}
            >
              Holographic Analytics
            </span>
            <h1 className="text-4xl font-extrabold text-white mt-4 leading-tight tracking-tight">
              Future of Wealth <br />
              <span style={{ color: "#A8FF60", textShadow: "0 0 20px rgba(168,255,96,0.3)" }}>Tracking is Here.</span>
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-3 leading-relaxed">
              Experience the next-generation financial ledger. Monitor assets, track automated subscriptions, and build real-time visual charts.
            </p>
          </div>

          {/* Glowing Holographic Chart Graphic */}
          <div 
            style={{
              background: "rgba(10,32,12,0.35)",
              border: "1px solid rgba(125,218,42,0.25)",
              borderRadius: "16px",
              padding: "24px 28px",
              backdropFilter: "blur(10px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 25px rgba(125,218,42,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#A8FF60", boxShadow: "0 0 8px #A8FF60" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>Portfolio Projection</span>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#A0A0A0" }}>+28.4% this year</span>
            </div>

            {/* SVG Animated Chart */}
            <svg viewBox="0 0 300 100" width="100%" height="100" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7DDA2A" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7DDA2A" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(125,218,42,0.08)" strokeWidth="1" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(125,218,42,0.08)" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(125,218,42,0.08)" strokeWidth="1" />

              {/* Area Gradient */}
              <path 
                d="M0,80 Q30,50 60,65 T120,40 T180,45 T240,25 T300,10 L300,100 L0,100 Z" 
                fill="url(#chartGlow)" 
              />

              {/* Line */}
              <path 
                d="M0,80 Q30,50 60,65 T120,40 T180,45 T240,25 T300,10" 
                fill="none" 
                stroke="#A8FF60" 
                strokeWidth="2.5" 
                filter="url(#glowFilter)"
              />

              {/* Dot Indicators */}
              <circle cx="120" cy="40" r="4" fill="#A8FF60" stroke="#020A04" strokeWidth="1.5" />
              <circle cx="240" cy="25" r="4" fill="#A8FF60" stroke="#020A04" strokeWidth="1.5" />
              <circle cx="300" cy="10" r="4.5" fill="#fff" stroke="#7DDA2A" strokeWidth="2" filter="url(#glowFilter)" />
            </svg>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: "0.72rem", color: "#A0A0A0", display: "flex", gap: "16px" }}>
          <span>© 2026 Clovifi Inc.</span>
          <span>•</span>
          <span>Apple Standard Protection</span>
        </div>
      </div>

      {/* ── RIGHT SIDE: GLASSMORPHIC FORM ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 relative">
        <div 
          className="w-full max-w-[420px] p-8 md:p-12 rounded-[32px] border"
          style={{
            background: "rgba(6, 22, 9, 0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "rgba(125, 218, 42, 0.22)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(125,218,42,0.04), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Mobile Clovifi Title */}
          <div className="flex md:hidden items-center gap-2 justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <use href="#leaf" fill="url(#cloverGrad)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(90 16 16)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(180 16 16)" />
              <use href="#leaf" fill="url(#cloverGrad)" transform="rotate(270 16 16)" />
            </svg>
            <span className="text-xl font-extrabold text-white">Clovifi</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-[#A0A0A0] mt-1.5 mb-8">
            Log in to continue to your account.
          </p>

          {error && (
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.25)",
                color: "#fca5a5",
                fontSize: "0.75rem",
                marginBottom: "20px"
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#A0A0A0] text-[10px] font-bold uppercase tracking-wider mb-2">
                Username
              </label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#A0A0A0" }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  placeholder="Enter username"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 42px",
                    borderRadius: "12px",
                    background: "rgba(2,10,4,0.65)",
                    border: "1px solid rgba(125,218,42,0.18)",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,218,42,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 10px rgba(125,218,42,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,218,42,0.18)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A0A0A0] text-[10px] font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#A0A0A0" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 42px",
                    borderRadius: "12px",
                    background: "rgba(2,10,4,0.65)",
                    border: "1px solid rgba(125,218,42,0.18)",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,218,42,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 10px rgba(125,218,42,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(125,218,42,0.18)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#A0A0A0",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Password strength bar */}
              {isRegister && password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "all 0.3s" }} />
                  </div>
                  <div style={{ fontSize: "9px", color: "#A0A0A0", marginTop: "4px", textAlign: "right" }}>
                    Strength: <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              style={{
                width: "100%",
                padding: "13px 24px",
                marginTop: "16px",
                borderRadius: "12px",
                background: "linear-gradient(to bottom, #7DDA2A 0%, #4CAF50 100%)",
                border: "1px solid rgba(168,255,96,0.3)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.02em",
                cursor: "pointer",
                boxShadow: "0 0 15px rgba(125,218,42,0.25), 0 4px 6px rgba(0,0,0,0.4)",
                transition: "all 0.15s",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.boxShadow = "0 0 25px rgba(125,218,42,0.4), 0 4px 6px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "0 0 15px rgba(125,218,42,0.25), 0 4px 6px rgba(0,0,0,0.4)";
              }}
            >
              {isRegister ? "Create Account" : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "28px 0" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>OR</span>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Google Mock OAuth Button */}
          <button
            onClick={handleMockGoogleLogin}
            style={{
              width: "100%",
              padding: "12px 24px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(125,218,42,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            {/* Google Icon */}
            <svg style={{ width: "14px", height: "14px" }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google (Demo)
          </button>

          {/* Toggle Register/Login Link */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#7DDA2A",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "underline",
                transition: "color 0.15s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#A8FF60"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#7DDA2A"}
            >
              {isRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const particles: { x: number; y: number; r: number; vy: number; vx: number; alpha: number }[] = [];

    // Create 40 particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        vy: -(Math.random() * 0.4 + 0.1),
        vx: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125, 218, 42, ${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#7DDA2A";
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 500;
      height = canvas.height = canvas.parentElement?.clientHeight || 800;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none"
      }}
    />
  );
}

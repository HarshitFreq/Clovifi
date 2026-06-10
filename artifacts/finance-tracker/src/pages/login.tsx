import React, { useState, useEffect } from "react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { KeyRound, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AeroBackground from "@/components/AeroBackground";

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

  // Load Google GIS button once component mounts
  useEffect(() => {
    /* global google */
    if (typeof window !== "undefined" && (window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: "mock-google-client-id.apps.googleusercontent.com", // Fallback mock client ID
          callback: handleGoogleLoginCallback,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "dark", size: "large", width: 320, text: "signin_with" }
        );
      } catch (err) {
        console.warn("Google GIS initialization skipped / no environment configuration", err);
      }
    }
  }, []);

  const handleGoogleLoginCallback = async (response: any) => {
    setError(null);
    try {
      // Decode mock or real credential token (standard JWT payload decode)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      // Call our API with Google details
      const r = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: decoded.sub,
          email: decoded.email,
          username: decoded.name || decoded.given_name,
        }),
      });

      if (!r.ok) {
        const body = await r.json();
        throw new Error(body.error || "Google Auth failed");
      }

      toast({
        title: "Welcome!",
        description: `Logged in via Google as ${decoded.email}`,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Google Login failed.");
    }
  };

  // Mock login with Google function if GIS iframe fails or is blocked
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

  // Password Strength Checker
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-transparent" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score, label: "Weak", color: "bg-red-500 w-1/4" };
      case 2: return { score, label: "Fair", color: "bg-orange-500 w-2/4" };
      case 3: return { score, label: "Good", color: "bg-yellow-500 w-3/4" };
      case 4: return { score, label: "Strong", color: "bg-green-500 w-full" };
      default: return { score: 0, label: "Weak", color: "bg-red-500 w-1/4" };
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <AeroBackground />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="p-8 rounded-3xl border border-[rgba(100,200,30,0.25)] bg-[rgba(10,25,5,0.45)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(10,30,5,0.65)] flex flex-col items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-5">
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.55))" }}>
              <defs>
                <radialGradient id="leafGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#c5f838" />
                  <stop offset="30%" stopColor="#66c028" />
                  <stop offset="80%" stopColor="#1b5a04" />
                  <stop offset="100%" stopColor="#0b3002" />
                </radialGradient>
                <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#66c028" />
                  <stop offset="100%" stopColor="#144602" />
                </linearGradient>
                <linearGradient id="glossReflection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <path id="clover-leaf" d="M 16 16 C 13.5 12.5, 10.5 11, 10.5 7.8 C 10.5 4.8, 13.2 4.8, 16 8 C 18.8 4.8, 21.5 4.8, 21.5 7.8 C 21.5 11, 18.5 12.5, 16 16 Z" />
              </defs>
              <path d="M 16 16 Q 16 23 23 27.5" stroke="url(#stemGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <use href="#clover-leaf" fill="url(#leafGrad)" />
              <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(90 16 16)" />
              <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(180 16 16)" />
              <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(270 16 16)" />
              <circle cx="16" cy="16" r="2.8" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.35" />
              <path d="M 6 16 C 6 10.4772 10.4772 6 16 6 C 21.5228 6 26 10.4772 26 16 C 26 17.5 24 13.5 16 13.5 C 8 13.5 6 17.5 6 16 Z" fill="url(#glossReflection)" />
            </svg>

            <span className="font-extrabold text-2xl tracking-wide bg-gradient-to-b from-white to-[#a3e635] bg-clip-text text-transparent filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
              Clovifi
            </span>
          </div>

          <h2 className="text-lg font-bold text-white mb-1 tracking-tight text-center">
            Aero Finance Tracker
          </h2>
          <p className="text-white/60 text-xs mb-5 text-center">
            {isRegister ? "Create a secure account" : "Log in to track your wealth"}
          </p>

          {error && (
            <div className="w-full flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/35 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            <div>
              <label className="block text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="alphanumeric only"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#8be034] focus:bg-white/10 transition-all duration-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#8be034] focus:bg-white/10 transition-all duration-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {isRegister && password && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} />
                  </div>
                  <div className="text-[10px] text-white/50 text-right">
                    Strength: <span className="font-semibold text-[#8be034]">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-[#8be034] to-[#49a018] hover:from-[#9ded40] hover:to-[#5db820] text-white font-bold tracking-wide shadow-md active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-xs border border-[rgba(255,255,255,0.15)]"
            >
              {isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-2 my-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Or</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          {/* Google SSO Buttons */}
          <div className="w-full flex flex-col gap-2 items-center">
            {/* GIS standard iframe mount point */}
            <div id="google-signin-btn" className="w-full overflow-hidden rounded-xl flex justify-center scale-90" />
            
            {/* Direct Glass Mock Login Google Button */}
            <button
              onClick={handleMockGoogleLogin}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98]"
            >
              {/* Google G icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign in with Google (Demo)
            </button>
          </div>

          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="mt-4 text-[#8be034] hover:text-[#9ded40] hover:underline text-[11px] transition duration-200"
          >
            {isRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

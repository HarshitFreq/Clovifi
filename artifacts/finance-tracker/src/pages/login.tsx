import React, { useState } from "react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { AlertCircle, Eye, EyeOff, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    if (!pass) return { score: 0, label: "", color: "transparent", width: "0%" };
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
      className="min-h-[100dvh] w-full flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: "var(--bg-color)",
        backgroundImage: "radial-gradient(circle at center, var(--panel-glow) 0%, transparent 75%)",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      }}
    >
      <div
        className="w-full max-w-[400px] p-6 sm:p-8 md:p-10 rounded-2xl border transition-all duration-300"
        style={{
          background: "var(--panel-bg)",
          borderColor: "var(--panel-border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.45) 100%)",
              border: "1px solid var(--panel-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              fontSize: "24px",
              lineHeight: 1,
            }}
          >
            🍀
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? "Create your account" : "Sign in to Clovifi"}
          </h2>
          <p className="text-xs text-zinc-400 mt-2">
            {isRegister ? "Start tracking your assets and subscriptions today" : "Enter your credentials to access your ledger"}
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: "0.75rem",
              marginBottom: "20px",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Username
            </label>
            <div style={{ position: "relative" }}>
              <User
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "14px",
                  height: "14px",
                  color: "#71717a",
                  zIndex: 2,
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="Enter username"
                required
                style={{
                  width: "100%",
                  padding: "11px 16px 11px 40px",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "14px",
                  height: "14px",
                  color: "#71717a",
                  zIndex: 2,
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 40px",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  boxSizing: "border-box",
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
                  color: "#71717a",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  zIndex: 3,
                }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {isRegister && password && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ height: "3px", width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "all 0.3s" }} />
                </div>
                <div style={{ fontSize: "9px", color: "#a1a1aa", marginTop: "4px", textAlign: "right" }}>
                  Password strength: <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending || registerMutation.isPending}
            className="hover:brightness-105 active:scale-95 transition-all duration-150"
            style={{
              width: "100%",
              padding: "11px 24px",
              marginTop: "4px",
              borderRadius: "8px",
              background: "linear-gradient(to bottom, var(--accent-gradient-1) 0%, var(--accent-gradient-3) 100%)",
              border: "1px solid var(--accent-border-color)",
              color: "#000",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: "0 0 10px var(--accent-glow-shadow)",
            }}
          >
            {isRegister
              ? registerMutation.isPending ? "Creating Account..." : "Create Account"
              : loginMutation.isPending ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "24px 0" }}>
          <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>or</span>
          <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Google Mock OAuth Button */}
        <button
          onClick={handleMockGoogleLogin}
          className="hover:bg-white/5 transition-all duration-150"
          style={{
            width: "100%",
            padding: "10px 24px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          {/* Google Icon */}
          <svg style={{ width: "13px", height: "13px" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign in with Google (Demo)
        </button>

        {/* Toggle Register/Login Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="hover:brightness-125 transition-all duration-150"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-gradient-1)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {isRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

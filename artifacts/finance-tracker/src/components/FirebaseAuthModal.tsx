import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  syncFirebaseUserWithBackend,
  isFirebaseConfigured,
  type FirebaseUser,
} from "@/lib/firebase";
import { X, Check, ShieldCheck, Mail, Lock, LogOut, Flame, AlertCircle } from "lucide-react";
import { useSoundEffects } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  onSuccess?: () => void;
}

export default function FirebaseAuthModal({ open, onClose, initialMode = "signin", onSuccess }: Props) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [tab, setTab] = useState<"google" | "email">("email");
  const [isRegister, setIsRegister] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playClick, playSuccess } = useSoundEffects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: localUser } = useGetMe();

  const isUserAuthenticated = Boolean(
    currentUser || (localUser && localUser.username && localUser.username !== "demouser")
  );
  const activeDisplayName = currentUser
    ? currentUser.displayName || currentUser.email
    : localUser && localUser.username !== "demouser"
    ? localUser.username
    : null;

  useEffect(() => {
    if (open) {
      setIsRegister(initialMode === "signup");
      setError(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    playClick();
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        throw new Error(
          "Google Sign-In is currently unavailable. Please use the Email & Password tab to sign in or create an account."
        );
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncFirebaseUserWithBackend(user);
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries();
      playSuccess();
      toast({
        title: "Signed In",
        description: `Welcome back, ${user.displayName || user.email}! Your personal ledger is ready.`,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      const code = err?.code || "";
      const raw = (err?.message || "").toString();
      if (code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. You can sign in anytime.");
      } else if (code === "auth/invalid-api-key" || !isFirebaseConfigured) {
        setError(
          "Google Sign-In is unavailable. Please continue using Email & Password."
        );
      } else if (raw.includes("The string did not match the expected pattern")) {
        setError("Sign-in encountered a browser format issue. Please continue using Email & Password.");
      } else {
        setError(err?.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setError(null);
    setLoading(true);

    try {
      const cleanInput = email.trim();
      if (!cleanInput) {
        throw new Error("Please enter your email or username.");
      }

      const isEmail = cleanInput.includes("@");
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanInput)) {
          throw new Error("Please enter a valid email address (e.g. user@example.com).");
        }
      } else {
        if (cleanInput.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const authIdentifier = isEmail
        ? cleanInput
        : `${cleanInput.toLowerCase().replace(/[^a-z0-9_]/g, "")}@clovifi.app`;
      const candidateUsername = cleanInput.includes("@")
        ? cleanInput.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
        : cleanInput.toLowerCase().replace(/[^a-z0-9_]/g, "");

      const fallbackToLocal = async () => {
        if (candidateUsername.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        if (isRegister) {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: candidateUsername, password }),
          });
          const contentType = res.headers.get("content-type") || "";
          let data: any = {};
          if (contentType.includes("application/json")) {
            data = await res.json().catch(() => ({}));
          }
          if (!res.ok) {
            throw new Error(data.error || "Registration failed");
          }
        } else {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: candidateUsername, password }),
          });
          const contentType = res.headers.get("content-type") || "";
          let data: any = {};
          if (contentType.includes("application/json")) {
            data = await res.json().catch(() => ({}));
          }
          if (!res.ok) {
            throw new Error(data.error || "Invalid username or password.");
          }
        }
      };

      if (isFirebaseConfigured && auth) {
        let user: FirebaseUser | null = null;
        try {
          if (isRegister) {
            const res = await createUserWithEmailAndPassword(auth, authIdentifier, password);
            user = res.user;
          } else {
            const res = await signInWithEmailAndPassword(auth, authIdentifier, password);
            user = res.user;
          }
          await syncFirebaseUserWithBackend(user);
        } catch (fbErr: any) {
          // If Firebase Auth does not have email/password sign-in enabled yet, fall back seamlessly to backend auth
          if (
            fbErr?.code === "auth/operation-not-allowed" ||
            fbErr?.code === "auth/configuration-not-found" ||
            fbErr?.code === "auth/invalid-api-key"
          ) {
            console.warn("Firebase Auth provider unavailable, falling back to local database auth");
            await fallbackToLocal();
          } else {
            throw fbErr;
          }
        }
      } else {
        await fallbackToLocal();
      }

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries();
      playSuccess();
      toast({
        title: isRegister ? "Account Created" : "Signed In",
        description: `Welcome to your personal financial ledger!`,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      const rawMessage = (err?.message || "").toString();
      const code = err?.code || "";

      let friendlyMessage = "Authentication failed. Please check your details and try again.";

      if (
        code === "auth/email-already-in-use" ||
        rawMessage.includes("auth/email-already-in-use") ||
        rawMessage.includes("Username already exists")
      ) {
        friendlyMessage = "An account with this email/username already exists. Please sign in instead.";
      } else if (
        code === "auth/invalid-email" ||
        rawMessage.includes("auth/invalid-email")
      ) {
        friendlyMessage = "Please enter a valid email address (e.g. user@example.com).";
      } else if (
        code === "auth/weak-password" ||
        rawMessage.includes("auth/weak-password")
      ) {
        friendlyMessage = "Password is too weak. Please use at least 6 characters.";
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        rawMessage.includes("auth/invalid-credential") ||
        rawMessage.includes("auth/user-not-found") ||
        rawMessage.includes("auth/wrong-password")
      ) {
        friendlyMessage = "Invalid email/username or password. Please verify and try again.";
      } else if (
        code === "auth/too-many-requests" ||
        rawMessage.includes("auth/too-many-requests")
      ) {
        friendlyMessage = "Too many attempts. Please wait a moment and try again.";
      } else if (
        code === "auth/network-request-failed" ||
        rawMessage.includes("auth/network-request-failed")
      ) {
        friendlyMessage = "Network connection problem. Please check your internet connection.";
      } else if (
        rawMessage.includes("The string did not match the expected pattern") ||
        err?.name === "SyntaxError"
      ) {
        friendlyMessage = "Please verify your email address format (e.g. user@example.com).";
      } else if (
        err?.message &&
        !err.message.includes("Firebase:") &&
        !err.message.includes("HTTP")
      ) {
        friendlyMessage = err.message;
      }

      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    playClick();
    setLoading(true);
    try {
      if (auth && auth.currentUser) {
        await signOut(auth);
      }
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries();
      playSuccess();
      toast({
        title: "Signed Out",
        description: "Returned to guest mode.",
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.75rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "400px",
          maxHeight: "92dvh",
          overflowY: "auto",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.85), inset 0 1px 0 var(--panel-border)",
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Titlebar */}
        <div
          className="panel-titlebar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px", lineHeight: 1 }}>☘️</span>
            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Account Sign In & Sync</span>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Active status banner */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              background: isUserAuthenticated ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
              border: isUserAuthenticated ? "1px solid rgba(74,222,128,0.3)" : "1px solid var(--panel-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.74rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} style={{ color: isUserAuthenticated ? "#6ee87a" : "var(--accent-gradient-1)" }} />
              <span>
                {isUserAuthenticated ? `Signed In: ${activeDisplayName}` : "Guest Mode"}
              </span>
            </div>

            {isUserAuthenticated && (
              <button
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f87171",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <LogOut size={11} />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Tab selector */}
          <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "4px" }}>
            <button
              onClick={() => {
                playClick();
                setTab("google");
              }}
              style={{
                flex: 1,
                padding: "5px",
                borderRadius: "3px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
                background: tab === "google" ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none",
                color: tab === "google" ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              Google
            </button>
            <button
              onClick={() => {
                playClick();
                setTab("email");
              }}
              style={{
                flex: 1,
                padding: "5px",
                borderRadius: "3px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
                background: tab === "email" ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none",
                color: tab === "email" ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              Email & Password
            </button>
          </div>

          {tab === "google" ? (
            /* Google Sign-in Option */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", padding: "10px 0" }}>
              <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.5 }}>
                Sign in with your Google Account to access and synchronize your personal ledger across all your devices.
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="toolbar-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "9px 20px",
                  borderRadius: "4px",
                  width: "100%",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                }}
              >
                {/* SVG Google G Logo */}
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? "Connecting..." : "Continue with Google"}</span>
              </button>
            </div>
          ) : (
            /* Email & Password Form */
            <form noValidate onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--title-text)", marginBottom: "4px", display: "block" }}>
                  Email or Username
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--panel-border)", borderRadius: "4px", padding: "6px 10px" }}>
                  <Mail size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com or username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete={isRegister ? "username" : "username"}
                    style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.8rem", width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--title-text)", marginBottom: "4px", display: "block" }}>
                  Password
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--panel-border)", borderRadius: "4px", padding: "6px 10px" }}>
                  <Lock size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.8rem", width: "100%" }}
                  />
                </div>
                {isRegister && (
                  <div style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.45)", marginTop: "3px" }}>
                    At least 6 characters
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                <span
                  onClick={() => setIsRegister(!isRegister)}
                  style={{ fontSize: "0.72rem", color: "var(--accent-gradient-1)", cursor: "pointer", textDecoration: "underline" }}
                >
                  {isRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-button"
                style={{ padding: "8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, marginTop: "4px" }}
              >
                {loading ? "Processing..." : isRegister ? "Create Free Account" : "Sign In"}
              </button>
            </form>
          )}

          {error && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: "4px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Guest option */}
          <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "10px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  Volume2,
  VolumeX,
  LogOut,
} from "lucide-react";
import { useSoundEffects } from "@/lib/sound";
import { useGetMe } from "@workspace/api-client-react";
import { auth, onAuthStateChanged, performLogout, type FirebaseUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import FirebaseAuthModal from "@/components/FirebaseAuthModal";
import Clovifi3DVisualizer from "@/components/Clovifi3DVisualizer";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { playClick, playSuccess, soundEnabled, setSoundEnabled } = useSoundEffects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const handleLogout = async () => {
    playClick();
    await performLogout();
    setFirebaseUser(null);
    await queryClient.invalidateQueries();
    playSuccess();
    toast({
      title: "Signed Out",
      description: "Returned to guest mode.",
    });
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  const validUser = (user && typeof user === "object" && typeof (user as any).username === "string")
    ? (user as { username: string })
    : null;

  const isAuthenticated = Boolean(
    firebaseUser || (validUser && validUser.username !== "demouser")
  );
  const activeName = firebaseUser
    ? firebaseUser.displayName || firebaseUser.email?.split("@")[0]
    : validUser && validUser.username !== "demouser"
    ? validUser.username
    : null;

  const openAuth = (mode: "signin" | "signup") => {
    playClick();
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(1.25rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))",
        boxSizing: "border-box",
        background: "radial-gradient(circle at 50% 45%, #0d3816 0%, #061c0b 45%, #020a04 100%)",
        userSelect: "none",
      }}
    >
      {/* ── Subtle Atmospheric Ambient Orbs (Soft, Low-Contrast) ── */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "min(480px, 80vw)",
          height: "min(480px, 80vw)",
          background: "radial-gradient(circle, rgba(74, 222, 128, 0.06) 0%, rgba(34, 197, 94, 0.02) 50%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: "min(540px, 85vw)",
          height: "min(540px, 85vw)",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, rgba(14, 165, 233, 0.015) 50%, transparent 75%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          transform: "translate(20%, 20%)",
        }}
      />

      {/* ── 3D Interactive Connected Dots Visualizer ── */}
      <Clovifi3DVisualizer />

      {/* ── Minimal Top-Right Bar ── */}
      <header
        style={{
          position: "fixed",
          top: "max(1rem, env(safe-area-inset-top))",
          right: "max(1rem, env(safe-area-inset-right))",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "fadeIn 0.3s ease",
        }}
      >
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="glass-panel"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  color: "#fff",
                }}
              >
                <span style={{ fontSize: "14px" }}>☘️</span>
                <span style={{ fontWeight: 600 }}>{activeName}</span>
              </div>
              <button
                onClick={() => openAuth("signin")}
                className="toolbar-btn"
                style={{ padding: "6px 12px", fontSize: "0.74rem", borderRadius: "4px" }}
                title="Account Settings"
              >
                Account
              </button>
              <button
                onClick={handleLogout}
                className="toolbar-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.74rem",
                  borderRadius: "4px",
                  color: "#f87171",
                  borderColor: "rgba(248, 113, 113, 0.28)",
                  background: "rgba(248, 113, 113, 0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Log Out"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => openAuth("signin")}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "5px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                className="hover:bg-white/10"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="glass-button"
                style={{
                  padding: "6px 14px",
                  borderRadius: "5px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </header>

      {/* ── Centered Minimal Hero ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxWidth: "min(440px, 94vw)",
          width: "100%",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* Brand Heading */}
        <h1
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 2.5vw, 14px)",
            margin: 0,
            lineHeight: 1,
            flexWrap: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: "clamp(2.0rem, 7vw, 3.4rem)",
              lineHeight: 1,
              display: "inline-block",
              filter: "drop-shadow(0 4px 16px rgba(74, 222, 128, 0.55)) drop-shadow(0 0 28px rgba(34, 197, 94, 0.4))",
              userSelect: "none",
              WebkitTextFillColor: "initial",
              transform: "translateY(-1px)",
              flexShrink: 0,
            }}
            role="img"
            aria-label="3-petal clover"
          >
            ☘️
          </span>
          <span
            className="brand-title"
            style={{
              fontSize: "clamp(2.6rem, 9.5vw, 4.2rem)",
              fontWeight: 900,
              fontFamily: "'Comfortaa', 'Century Gothic', 'Quicksand', 'Trebuchet MS', sans-serif",
              letterSpacing: "-0.035em",
              lineHeight: 1,
              margin: 0,
              background: "linear-gradient(180deg, #ffffff 20%, #bbf7d0 70%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 35px rgba(74, 222, 128, 0.4))",
            }}
          >
            Clovifi
          </span>
        </h1>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "clamp(0.88rem, 3.2vw, 1.05rem)",
            color: "rgba(255, 255, 255, 0.75)",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          Personal Finance Tracker
        </div>

          {/* Actions */}
          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "10px", width: "100%" }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#6ee87a",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(74, 222, 128, 0.12)",
                  padding: "5px 12px",
                  borderRadius: "16px",
                  border: "1px solid rgba(74, 222, 128, 0.28)",
                }}
              >
                <ShieldCheck size={14} />
                <span>Personal Account: <strong>{activeName}</strong></span>
              </div>

              <Link href="/dashboard" onClick={playSuccess} style={{ textDecoration: "none", width: "100%", maxWidth: "260px" }}>
                <button
                  className="glass-button"
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 24px",
                    borderRadius: "6px",
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span>Open Dashboard</span>
                  <ArrowRight size={15} />
                </button>
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.45)",
                  fontSize: "0.76rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "2px",
                  transition: "color 0.15s ease",
                }}
                className="hover:text-red-400"
              >
                <LogOut size={12} />
                <span>Log out of account</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
                width: "100%",
                maxWidth: "340px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  onClick={() => openAuth("signup")}
                  className="glass-button"
                  style={{
                    flex: 1,
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 18px",
                    borderRadius: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <UserPlus size={15} />
                  <span>Sign Up</span>
                </button>

                <button
                  onClick={() => openAuth("signin")}
                  className="toolbar-btn"
                  style={{
                    flex: 1,
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 18px",
                    borderRadius: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                  }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSuccess();
                  setLocation("/dashboard");
                }}
                className="toolbar-btn"
                style={{
                  width: "100%",
                  minHeight: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "9px 16px",
                  borderRadius: "6px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px dashed rgba(255, 255, 255, 0.28)",
                  color: "rgba(255, 255, 255, 0.85)",
                  marginTop: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Explore Demo / Guest Mode</span>
                <ArrowRight size={14} style={{ color: "var(--accent-gradient-1)" }} />
              </button>
            </div>
          )}
        </div>

      {/* ── Discreet Bottom Controls (Sound Toggle) ── */}
      <footer
        style={{
          position: "fixed",
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          left: "max(1rem, env(safe-area-inset-left))",
          display: "flex",
          alignItems: "center",
          zIndex: 25,
          pointerEvents: "none",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled(!soundEnabled);
            playClick();
          }}
          className="toolbar-btn"
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            minHeight: "36px",
            borderRadius: "4px",
            fontSize: "0.72rem",
            color: "rgba(255, 255, 255, 0.65)",
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          title={soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
        >
          {soundEnabled ? <Volume2 size={13} style={{ color: "#4ade80" }} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? "Audio On" : "Muted"}</span>
        </button>
      </footer>

      {/* ── Firebase & Account Auth Modal ── */}
      <FirebaseAuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => setLocation("/dashboard")}
      />
    </div>
  );
}

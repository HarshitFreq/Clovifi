import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  Volume2,
  VolumeX,
  Eye,
} from "lucide-react";
import { useSoundEffects } from "@/lib/sound";
import { useGetMe } from "@workspace/api-client-react";
import { auth, onAuthStateChanged, type FirebaseUser } from "@/lib/firebase";
import FirebaseAuthModal from "@/components/FirebaseAuthModal";
import Clovifi3DVisualizer from "@/components/Clovifi3DVisualizer";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { playClick, playSuccess, soundEnabled, setSoundEnabled } = useSoundEffects();
  const { data: user } = useGetMe();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [zenMode, setZenMode] = useState(false); // Hide UI for full screensaver experience

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  const isAuthenticated = Boolean(
    firebaseUser || (user && user.username && user.username !== "demouser")
  );
  const activeName = firebaseUser
    ? firebaseUser.displayName || firebaseUser.email?.split("@")[0]
    : user && user.username !== "demouser"
    ? user.username
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
        padding: "1.5rem",
        boxSizing: "border-box",
        background: "radial-gradient(circle at 50% 45%, #0d3816 0%, #061c0b 45%, #020a04 100%)",
        userSelect: "none",
      }}
      onClick={() => {
        if (zenMode) setZenMode(false);
      }}
    >
      {/* ── Atmospheric Ambient Glowing Orbs ── */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(74, 222, 128, 0.14) 0%, rgba(34, 197, 94, 0.04) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: "540px",
          height: "540px",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 75%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          transform: "translate(20%, 20%)",
        }}
      />

      {/* ── 3D Interactive Particle Visualizer Background (Inspired by 3d_Portfolio) ── */}
      <Clovifi3DVisualizer />

      {/* ── Minimal Top-Right Bar ── */}
      {!zenMode && (
        <header
          style={{
            position: "fixed",
            top: "1.25rem",
            right: "1.5rem",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: "10px",
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
      )}

      {/* ── Centered Minimal Hero ── */}
      {!zenMode && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            maxWidth: "420px",
            width: "100%",
            animation: "fadeIn 0.3s ease",
          }}
        >
          {/* Brand Heading */}
          <h1
            className="brand-title"
            style={{
              fontSize: "4.2rem",
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
          </h1>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "1.05rem",
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
                <span>Private Database: <strong>{activeName}</strong></span>
              </div>

              <Link href="/dashboard" onClick={playSuccess} style={{ textDecoration: "none", width: "100%", maxWidth: "240px" }}>
                <button
                  className="glass-button"
                  style={{
                    width: "100%",
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
                maxWidth: "320px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  onClick={() => openAuth("signup")}
                  className="glass-button"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 18px",
                    borderRadius: "6px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <UserPlus size={14} />
                  <span>Sign Up</span>
                </button>

                <button
                  onClick={() => openAuth("signin")}
                  className="toolbar-btn"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 18px",
                    borderRadius: "6px",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                  }}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
              </div>

              <Link href="/dashboard" onClick={playSuccess} style={{ textDecoration: "none", marginTop: "4px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.45)",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                  }}
                  className="hover:text-white"
                >
                  Continue as guest to demo workspace →
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Discreet Bottom Controls (Sound Toggle & Zen Mode) ── */}
      <footer
        style={{
          position: "fixed",
          bottom: "1rem",
          left: "1.5rem",
          right: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            padding: "5px 9px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            color: "rgba(255, 255, 255, 0.65)",
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          title={soundEnabled ? "Mute Aero Sound Effects" : "Enable Aero Sound Effects"}
        >
          {soundEnabled ? <Volume2 size={13} style={{ color: "#4ade80" }} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? "Audio On" : "Muted"}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setZenMode(!zenMode);
            playClick();
          }}
          className="toolbar-btn"
          style={{
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 9px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            color: "rgba(255, 255, 255, 0.65)",
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          title={zenMode ? "Exit Screensaver View" : "Zen Screensaver View (Hide UI)"}
        >
          <Eye size={13} />
          <span>{zenMode ? "Show UI" : "Screensaver"}</span>
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

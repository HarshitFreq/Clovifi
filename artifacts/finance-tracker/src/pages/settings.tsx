import React, { useState, useEffect } from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { useSoundEffects } from "@/lib/sound";
import {
  Check, Volume2, VolumeX, Trash2, Database, Sliders,
  User, RefreshCw, AlertTriangle, ShieldCheck, LogIn, LogOut,
  Info, ExternalLink, Heart
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import FirebaseAuthModal from "@/components/FirebaseAuthModal";
import { auth, onAuthStateChanged, signOut, type FirebaseUser } from "@/lib/firebase";
import { localLedger } from "@/lib/local-ledger";

const themes = [
  { id: "emerald", name: "Emerald", color: "#66c028" },
  { id: "sapphire", name: "Sapphire", color: "#60a5fa" },
  { id: "amethyst", name: "Amethyst", color: "#c084fc" },
  { id: "ruby", name: "Ruby", color: "#f87171" },
  { id: "noir", name: "Noir", color: "#a1a1aa" },
];

export default function Settings() {
  const { currency, setCurrency } = useCurrency();
  const { soundEnabled, setSoundEnabled, playSuccess, playClick } = useSoundEffects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, refetch: refetchMe } = useGetMe();

  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("clovifi_theme") || "emerald";
  });

  const [username, setUsername] = useState(user?.username || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [demoLoading, setDemoLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem("clovifi_theme", themeId);
    const classes = ["theme-sapphire", "theme-amethyst", "theme-ruby", "theme-noir"];
    classes.forEach((c) => document.documentElement.classList.remove(c));
    if (themeId !== "emerald" && classes.includes(`theme-${themeId}`)) {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
    playSuccess();
    toast({
      title: "Theme Applied",
      description: `Switched to ${themes.find((t) => t.id === themeId)?.name || themeId} theme.`,
    });
  };

  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    playSuccess();
    toast({
      title: "Currency Updated",
      description: `Default currency symbol set to ${newCode}.`,
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    const clean = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (clean.length < 3) {
      setProfileError("Username must be at least 3 alphanumeric characters.");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        let errMessage = "Failed to update profile";
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          if (data.error) errMessage = data.error;
        }
        throw new Error(errMessage);
      }
      playSuccess();
      toast({
        title: "Profile Updated",
        description: "Username saved successfully.",
      });
      await refetchMe();
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      setProfileError(err?.message || "Failed to save username.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo-data", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      let json: any = {};
      if (contentType.includes("application/json")) {
        json = await res.json().catch(() => ({}));
      }
      if (!res.ok) throw new Error(json.error || "Failed to load sample data");
      await queryClient.invalidateQueries();
      playSuccess();
      toast({
        title: "Sample Data Loaded",
        description: `Seeded ${json.seeded?.transactions ?? 16} transactions across ${json.seeded?.accounts ?? 3} accounts.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to Load Sample Data",
        description: err?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      localLedger.clearAll();
      await fetch("/api/admin/clear-all", { method: "DELETE" }).catch(() => {});
      await queryClient.resetQueries();
      await queryClient.invalidateQueries();
      setConfirmClear(false);
      playSuccess();
      toast({
        title: "Ledger Cleared",
        description: "All transactions, accounts, and categories have been removed.",
      });
    } catch (err: any) {
      toast({
        title: "Clear Failed",
        description: err?.message || "Failed to clear ledger.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3" style={{ maxWidth: "800px" }}>
      {/* ── 1. Preferences ── */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sliders size={13} style={{ color: "var(--accent-gradient-1)" }} />
          <span>Preferences</span>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Currency */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Display Currency
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Symbol used across accounts and reports
              </div>
            </div>

            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--panel-border)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "0.78rem",
                padding: "6px 10px",
                outline: "none",
                minWidth: "160px",
                cursor: "pointer",
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} style={{ background: "#060d05", color: "#fff" }}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          {/* Color Theme */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Color Theme
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Visual accent palette for graphs and highlights
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {themes.map((t) => {
                const isSelected = activeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      borderRadius: "4px",
                      background: isSelected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                      border: isSelected ? `1.5px solid ${t.color}` : "1px solid var(--panel-border)",
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.65)",
                      fontSize: "0.72rem",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: t.color,
                        boxShadow: isSelected ? `0 0 6px ${t.color}` : "none",
                      }}
                    />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          {/* Sound Effects */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Audio Feedback
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Subtle micro-interaction chimes on clicks and actions
              </div>
            </div>

            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playSuccess();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "4px",
                background: soundEnabled ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
                border: soundEnabled ? "1px solid rgba(74,222,128,0.4)" : "1px solid var(--panel-border)",
                color: soundEnabled ? "#6ee87a" : "rgba(255,255,255,0.4)",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {soundEnabled ? <><Volume2 size={12} /> Audio On</> : <><VolumeX size={12} /> Muted</>}
            </button>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          {/* User Display Name */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Display Name
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Personal account username
              </div>
            </div>

            <form onSubmit={handleProfileSave} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="Username"
                style={{
                  padding: "5px 8px",
                  borderRadius: "4px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--panel-border)",
                  color: "#fff",
                  fontSize: "0.76rem",
                  outline: "none",
                  width: "130px",
                }}
              />
              <button
                type="submit"
                disabled={profileSaving || !username || username === user?.username}
                className="glass-button"
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  opacity: (!username || username === user?.username) ? 0.5 : 1,
                }}
              >
                {profileSaving ? "..." : "Save"}
              </button>
            </form>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          {/* Cloud Account Authentication */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Cloud Backup & Sync
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                {firebaseUser ? `Synced: ${firebaseUser.email || firebaseUser.displayName}` : "Sign in with Google or Email to backup and sync your ledger"}
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                setIsAuthModalOpen(true);
              }}
              className="toolbar-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "4px",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: firebaseUser ? "#6ee87a" : "var(--accent-gradient-1)",
              }}
            >
              {firebaseUser ? (
                <><ShieldCheck size={12} /> Manage Account</>
              ) : (
                <><LogIn size={12} /> Sign In & Sync</>
              )}
            </button>
          </div>

          {profileError && (
            <div style={{ color: "#f87171", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={12} /> {profileError}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Data & Reset ── */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={13} style={{ color: "var(--accent-gradient-1)" }} />
          <span>Data & Records</span>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Sample Data */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                Reset to Sample Data
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Loads sample transactions and categories to explore features
              </div>
            </div>

            <button
              onClick={handleLoadDemo}
              disabled={demoLoading}
              className="toolbar-btn"
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                fontSize: "0.74rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <RefreshCw size={11} className={demoLoading ? "animate-spin" : ""} style={{ color: "var(--accent-gradient-1)" }} />
              <span>{demoLoading ? "Loading..." : "Load Sample Data"}</span>
            </button>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          {/* Clear All */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(248,113,113,0.95)" }}>
                Clear All Records
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                Permanently wipes all transactions, categories, and accounts
              </div>
            </div>

            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Trash2 size={11} />
                <span>Clear All Data</span>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "3px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--panel-border)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    background: "#c03030",
                    border: "1px solid #ef4444",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {clearing ? "Clearing..." : "Confirm Erase"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. About Clovifi ── */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={13} style={{ color: "var(--accent-gradient-1)" }} />
            <span>About Clovifi</span>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "10px",
              background: "rgba(74, 222, 128, 0.15)",
              color: "#4ade80",
              border: "1px solid rgba(74, 222, 128, 0.3)",
              letterSpacing: "0.02em",
            }}
          >
            v1.2.0 • Aero Edition
          </span>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                fontSize: "2rem",
                lineHeight: 1,
                padding: "8px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--panel-border)",
                filter: "drop-shadow(0 2px 8px rgba(74, 222, 128, 0.3))",
                flexShrink: 0,
              }}
            >
              ☘️
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Clovifi Personal Finance</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.5 }}>
                An offline-first, privacy-respecting financial tracker crafted with nostalgic Frutiger Aero aesthetics, interactive visualizers, real-time market data, and dual-layer local &amp; cloud ledger storage.
              </p>
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", fontSize: "0.7rem" }}>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              Architecture: <span style={{ color: "#fff", fontWeight: 500 }}>Dual Engine (Local + Cloud)</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              License: <span style={{ color: "#fff", fontWeight: 500 }}>Open Source (MIT)</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              Cloud &amp; Auth: <span style={{ color: "#fff", fontWeight: 500 }}>Firebase &amp; PostgreSQL</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              Author: <span style={{ color: "#fff", fontWeight: 500 }}>Harshit</span>
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--panel-border)", opacity: 0.5 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <a
              href="https://github.com/HarshitFreq/Clovifi"
              target="_blank"
              rel="noopener noreferrer"
              className="toolbar-btn"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <span>GitHub Repository</span>
              <ExternalLink size={11} style={{ opacity: 0.7 }} />
            </a>

            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Crafted with</span>
              <Heart size={10} style={{ color: "#4ade80", fill: "#4ade80" }} />
              <span>for financial sovereignty</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Firebase Auth Modal ── */}
      <FirebaseAuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

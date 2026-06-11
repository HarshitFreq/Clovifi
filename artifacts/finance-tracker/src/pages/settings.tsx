import React, { useState } from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { useSoundEffects } from "@/lib/sound";
import { Check, TriangleAlert, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const themes = [
  { id: "emerald", name: "Forest Emerald", color: "#8dda40", desc: "Signature green glow", gradient: "linear-gradient(135deg, #124808, #8dda40)" },
  { id: "sapphire", name: "Ocean Sapphire", color: "#60a5fa", desc: "Deep oceanic blue", gradient: "linear-gradient(135deg, #0f2043, #60a5fa)" },
  { id: "amethyst", name: "Cyber Amethyst", color: "#c084fc", desc: "Neon cyberpunk violet", gradient: "linear-gradient(135deg, #230c3c, #c084fc)" },
  { id: "ruby", name: "Crimson Ruby", color: "#f87171", desc: "Burgundy crimson warmth", gradient: "linear-gradient(135deg, #2d080f, #f87171)" },
  { id: "noir", name: "Classic Obsidian", color: "#a1a1aa", desc: "Monochrome slate & gray", gradient: "linear-gradient(135deg, #1c1c1c, #a1a1aa)" }
];

const bgStyles = [
  { id: "aurora", name: "Aurora Borealis", desc: "Layered glass ambient glow", color: "var(--accent-gradient-1)", previewGradient: "radial-gradient(circle, var(--accent-gradient-1) 10%, var(--accent-gradient-3) 90%)" },
  { id: "grid", name: "Minimalist Grid", desc: "Structured tech backdrop", color: "var(--accent-gradient-2)", previewGradient: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)" },
  { id: "oled", name: "OLED Starry Sky", desc: "Pitch-black sky & stars", color: "#ffffff", previewGradient: "radial-gradient(circle, #fff 1px, transparent 2px), radial-gradient(circle, #fff 1.5px, transparent 3px)" }
];

const soundPacks = [
  { id: "aero", name: "Aero Glass", desc: "Vista-style chimes", icon: "🔔" },
  { id: "arcade", name: "8-Bit Arcade", desc: "Retro arcade synth", icon: "🕹️" },
  { id: "subtle", name: "Subtle Click", desc: "Minimalist ticks", icon: "🔈" }
];

export default function Settings() {
  const { currency, setCurrency } = useCurrency();
  const { soundEnabled, setSoundEnabled, playSuccess, soundPack, setSoundPack } = useSoundEffects();
  const [selected, setSelected] = useState(currency);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("clovifi_theme") || "emerald";
  });

  const { toast } = useToast();

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem("clovifi_theme", themeId);
    
    // Apply theme
    const classes = ["theme-sapphire", "theme-amethyst", "theme-ruby", "theme-noir"];
    classes.forEach(c => document.documentElement.classList.remove(c));
    if (themeId !== "emerald" && classes.includes(`theme-${themeId}`)) {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
    
    playSuccess();
    
    toast({
      title: "Theme Applied ✨",
      description: `Switched to ${themes.find(t => t.id === themeId)?.name || themeId} theme.`,
    });
  };

  const [activeBgStyle, setActiveBgStyle] = useState(() => {
    return localStorage.getItem("clovifi_bg_style") || "aurora";
  });

  const handleBgStyleChange = (styleId: string) => {
    setActiveBgStyle(styleId);
    localStorage.setItem("clovifi_bg_style", styleId);
    
    // Apply background style
    const bgClasses = ["bg-style-grid", "bg-style-oled"];
    bgClasses.forEach(c => document.documentElement.classList.remove(c));
    if (styleId !== "aurora" && bgClasses.includes(`bg-style-${styleId}`)) {
      document.documentElement.classList.add(`bg-style-${styleId}`);
    }
    
    playSuccess();
    
    toast({
      title: "Background Applied 🌌",
      description: `Switched to ${bgStyles.find(b => b.id === styleId)?.name || styleId} background.`,
    });
  };
  const [saved, setSaved] = useState(false);

  const { data: user, refetch: refetchMe } = useGetMe();
  
  // Profile settings state
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [confirmStep, setConfirmStep] = useState<"idle" | "confirm" | "clearing" | "done">("idle");
  const [clearError, setClearError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<{ accounts: number; categories: number; transactions: number; subscriptions: number } | null>(null);
  const queryClient = useQueryClient();

  // Update form username if user data changes
  React.useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  function handleSave() {
    setCurrency(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLoadDemo() {
    setDemoLoading(true);
    setDemoResult(null);
    try {
      const res = await fetch("/api/demo-data", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setDemoResult(json.seeded);
      queryClient.invalidateQueries();
      toast({
        title: "Demo Data Loaded 🎉",
        description: `Seeded ${json.seeded.transactions} transactions, ${json.seeded.categories} categories, ${json.seeded.subscriptions} subscriptions across ${json.seeded.accounts} accounts.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to Load Demo Data",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (cleanUsername.length < 3) {
      setProfileError("Username must be at least 3 alphanumeric characters.");
      return;
    }
    if (password && password.length < 6) {
      setProfileError("Password must be at least 6 characters.");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password: password || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Profile Updated 🍀",
        description: "Your user settings were successfully saved.",
      });
      setPassword("");
      await refetchMe();
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      setProfileError(err?.message || "Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleClearAll() {
    setConfirmStep("clearing");
    setClearError(null);
    try {
      const res = await fetch("/api/admin/clear-all", { method: "DELETE" });
      if (!res.ok) throw new Error("Server returned " + res.status);
      await queryClient.invalidateQueries();
      setConfirmStep("done");
      setTimeout(() => setConfirmStep("idle"), 3000);
    } catch (e) {
      setClearError(e instanceof Error ? e.message : "Unknown error");
      setConfirmStep("idle");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Personalization — UI Color Themes */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Personalization — UI Color Themes</div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
            Color Theme
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", marginBottom: "14px", lineHeight: 1.5 }}>
            Select a custom color palette for Clovifi's background ambient gradients, cards, buttons, and accents.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            {themes.map((theme) => {
              const isSelected = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`currency-btn${isSelected ? " selected" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: theme.gradient,
                        border: "1.5px solid rgba(255, 255, 255, 0.25)",
                        boxShadow: `0 0 6px ${theme.color}35`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          color: isSelected ? "var(--title-text)" : "rgba(255,255,255,0.75)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {theme.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {theme.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check style={{ width: "13px", height: "13px", color: "var(--accent-gradient-1)", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Personalization — Ambient Background */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Personalization — Ambient Background</div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
            Background Style
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", marginBottom: "14px", lineHeight: 1.5 }}>
            Toggle between different dark-mode visual patterns for the app background.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            {bgStyles.map((style) => {
              const isSelected = activeBgStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => handleBgStyleChange(style.id)}
                  className={`currency-btn${isSelected ? " selected" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: style.previewGradient,
                        backgroundColor: style.id === "oled" ? "#000" : "transparent",
                        border: "1.5px solid rgba(255, 255, 255, 0.25)",
                        boxShadow: `0 0 6px ${style.color}25`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          color: isSelected ? "var(--title-text)" : "rgba(255,255,255,0.75)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {style.name}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {style.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check style={{ width: "13px", height: "13px", color: "var(--accent-gradient-1)", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Settings — Application Preferences */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Settings — Application Preferences</div>
        <div style={{ padding: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
              Display Currency
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", marginBottom: "14px", lineHeight: 1.5 }}>
              Choose the currency symbol shown across the app. Values are not converted — only the symbol changes.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "6px" }}>
              {CURRENCIES.map((cur) => {
                const isSelected = selected === cur.code;
                return (
                  <button
                    key={cur.code}
                    onClick={() => setSelected(cur.code)}
                    className={`currency-btn${isSelected ? " selected" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "4px", textAlign: "left", cursor: "pointer", width: "100%" }}
                  >
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      fontSize: "0.75rem", fontWeight: 800, fontFamily: "monospace",
                      background: isSelected ? "linear-gradient(to bottom, var(--accent-gradient-1) 0%, var(--accent-gradient-3) 100%)" : "rgba(0,0,0,0.4)",
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.6)",
                      border: isSelected ? "1px solid var(--accent-border-color)" : "1px solid var(--panel-border)",
                      boxShadow: isSelected ? "0 0 8px var(--accent-glow-shadow)" : "none",
                      textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                    }}>
                      {cur.symbol.length <= 2 ? cur.symbol : cur.code.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: isSelected ? "var(--title-text)" : "rgba(255,255,255,0.75)", letterSpacing: "0.02em" }}>{cur.code}</div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur.name}</div>
                    </div>
                    {isSelected && <Check style={{ width: "13px", height: "13px", color: "var(--accent-gradient-1)", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--panel-border)" }}>
            <button className="glass-button" onClick={handleSave} style={{ padding: "6px 20px", borderRadius: "4px", fontSize: "0.8rem" }}>
              Save Changes
            </button>
            {saved ? (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6ee87a", fontSize: "0.78rem", fontWeight: 600 }}>
                <Check style={{ width: "13px", height: "13px" }} /> Saved!
              </span>
            ) : selected !== currency ? (
              <span style={{ color: "rgba(200,160,80,0.75)", fontSize: "0.75rem" }}>Unsaved changes</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 4. Sound & Audio Feedback */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Sound & Audio Feedback</div>
        <div>
          {/* Toggle Row */}
          <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
                Retro Sound Effects
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.5 }}>
                Enable Vista-style chimes and micro-interactions for button clicks, navigation, successes, and deletions.
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="glass-button"
                style={{
                  padding: "6px 16px",
                  borderRadius: "4px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  minWidth: "120px",
                  background: soundEnabled ? undefined : "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.5) 100%)",
                  borderColor: soundEnabled ? undefined : "var(--panel-border)",
                  color: soundEnabled ? "#fff" : "rgba(255,255,255,0.35)",
                  boxShadow: soundEnabled ? undefined : "none",
                }}
              >
                {soundEnabled ? "🔊 Enabled" : "🔇 Disabled"}
              </button>
            </div>
          </div>

          {/* Sound Packs Row */}
          {soundEnabled && (
            <div style={{ padding: "16px", borderTop: "1px solid var(--panel-border)", background: "rgba(0, 0, 0, 0.1)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
                Sound Effects Scheme
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", marginBottom: "14px", lineHeight: 1.5 }}>
                Choose a custom audio pack for micro-interactions, warnings, and notifications.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                {soundPacks.map((pack) => {
                  const isSelected = soundPack === pack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setSoundPack(pack.id);
                        setTimeout(() => playSuccess(), 50);
                      }}
                      className={`currency-btn${isSelected ? " selected" : ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "4px",
                        textAlign: "left",
                        cursor: "pointer",
                        width: "100%",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: isSelected ? "1.5px solid var(--accent-border-color)" : "1.5px solid var(--panel-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          {pack.icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              color: isSelected ? "var(--title-text)" : "rgba(255,255,255,0.75)",
                              letterSpacing: "0.01em",
                            }}
                          >
                            {pack.name}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pack.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check style={{ width: "13px", height: "13px", color: "var(--accent-gradient-1)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. User Profile — Account Management */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">User Profile — Account Management</div>
        <form onSubmit={handleProfileSave} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
              Username
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              placeholder="alphanumeric username"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "8px 10px",
                borderRadius: "4px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--panel-border)",
                color: "var(--title-text)",
                fontSize: "0.85rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gradient-1)", marginBottom: "4px" }}>
              New Password (Leave blank to keep current)
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{
                width: "100%",
                maxWidth: "320px",
                padding: "8px 10px",
                borderRadius: "4px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--panel-border)",
                color: "var(--title-text)",
                fontSize: "0.85rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {profileError && (
            <div style={{ color: "#f87171", fontSize: "0.78rem" }}>
              ⚠️ {profileError}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="submit"
              disabled={profileSaving}
              className="glass-button"
              style={{ padding: "6px 20px", borderRadius: "4px", fontSize: "0.8rem" }}
            >
              {profileSaving ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Load Demo Data */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(99,102,241,0.25)" }}>
        <div
          className="panel-titlebar"
          style={{ background: "linear-gradient(to bottom, rgba(20,20,60,0.7) 0%, rgba(10,10,45,0.65) 100%)", borderBottom: "1px solid rgba(99,102,241,0.3)", color: "rgba(165,180,252,0.9)" }}
        >
          🧪 Demo Data
        </div>
        <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(165,180,252,0.95)", marginBottom: "4px" }}>Load Sample Data</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(130,140,200,0.7)", lineHeight: 1.6, maxWidth: "440px" }}>
              Populates your account with realistic Indian finance data — 4 accounts, rich categories with icons, 150+ transactions spread across 5 months, and 12 subscriptions. <strong style={{ color: "rgba(250,200,80,0.85)" }}>Replaces all existing data.</strong>
            </div>
            {demoResult && (
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { label: "Accounts", val: demoResult.accounts, emoji: "🏦" },
                  { label: "Categories", val: demoResult.categories, emoji: "🏷️" },
                  { label: "Transactions", val: demoResult.transactions, emoji: "📋" },
                  { label: "Subscriptions", val: demoResult.subscriptions, emoji: "🔄" },
                ].map(({ label, val, emoji }) => (
                  <div key={label} style={{ fontSize: "0.7rem", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "rgba(165,180,252,0.95)" }}>
                    {emoji} {val} {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            style={{
              padding: "8px 20px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, cursor: demoLoading ? "not-allowed" : "pointer",
              background: demoLoading ? "rgba(50,50,100,0.4)" : "linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.7) 100%)",
              border: "1px solid rgba(99,102,241,0.5)",
              color: demoLoading ? "rgba(165,180,252,0.5)" : "rgba(230,230,255,0.95)",
              boxShadow: demoLoading ? "none" : "0 0 12px rgba(99,102,241,0.3)",
              transition: "all 0.2s",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseOver={e => { if (!demoLoading) (e.currentTarget as HTMLElement).style.filter = "brightness(1.2)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
          >
            {demoLoading ? "Loading..." : "🚀 Load Demo Data"}
          </button>
        </div>
      </div>

      {/* 6. Danger Zone */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(200,50,50,0.25)" }}>
        <div
          className="panel-titlebar"
          style={{ background: "linear-gradient(to bottom, rgba(80,15,15,0.7) 0%, rgba(50,8,8,0.65) 100%)", borderBottom: "1px solid rgba(180,40,40,0.3)", color: "rgba(240,160,150,0.85)" }}
        >
          Danger Zone
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(240,160,150,0.9)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Trash2 style={{ width: "14px", height: "14px" }} />
                Clear All Data
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(180,120,110,0.7)", lineHeight: 1.5, maxWidth: "420px" }}>
                Permanently deletes all transactions, accounts, and categories. This cannot be undone.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
              {confirmStep === "idle" && (
                <button
                  onClick={() => setConfirmStep("confirm")}
                  style={{
                    padding: "6px 16px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                    background: "linear-gradient(to bottom, rgba(160,30,30,0.5) 0%, rgba(110,15,15,0.7) 100%)",
                    border: "1px solid rgba(200,60,60,0.4)",
                    color: "rgba(250,170,160,0.95)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    transition: "filter 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.filter = "brightness(1.2)")}
                  onMouseOut={e => (e.currentTarget.style.filter = "none")}
                >
                  Clear All Data
                </button>
              )}

              {confirmStep === "confirm" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.73rem", color: "rgba(250,180,150,0.9)", fontWeight: 600 }}>
                    <TriangleAlert style={{ width: "13px", height: "13px", color: "#f87171" }} />
                    This will erase everything. Are you sure?
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setConfirmStep("idle")}
                      style={{
                        padding: "5px 14px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                        background: "rgba(20,50,8,0.6)", border: "1px solid rgba(60,120,20,0.4)", color: "rgba(180,230,130,0.85)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAll}
                      style={{
                        padding: "5px 14px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        background: "linear-gradient(to bottom, #c03030 0%, #8a1515 50%, #6e0f0f 100%)",
                        border: "1px solid rgba(220,80,80,0.6)",
                        color: "#fff",
                        boxShadow: "0 0 8px rgba(200,40,40,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.7)",
                      }}
                    >
                      Yes, Clear All
                    </button>
                  </div>
                </div>
              )}

              {confirmStep === "clearing" && (
                <div style={{ fontSize: "0.75rem", color: "rgba(240,180,150,0.75)", fontStyle: "italic" }}>
                  Clearing...
                </div>
              )}

              {confirmStep === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "#6ee87a", fontWeight: 600 }}>
                  <Check style={{ width: "13px", height: "13px" }} /> All data cleared.
                </div>
              )}

              {clearError && (
                <div style={{ fontSize: "0.72rem", color: "#f87171" }}>Error: {clearError}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

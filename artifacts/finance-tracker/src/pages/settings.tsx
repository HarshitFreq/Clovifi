import React, { useState } from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { useSoundEffects } from "@/lib/sound";
import { Check, TriangleAlert, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { currency, setCurrency } = useCurrency();
  const { soundEnabled, setSoundEnabled } = useSoundEffects();
  const [selected, setSelected] = useState(currency);
  const [saved, setSaved] = useState(false);

  const { data: user, refetch: refetchMe } = useGetMe();
  const { toast } = useToast();
  
  // Profile settings state
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [confirmStep, setConfirmStep] = useState<"idle" | "confirm" | "clearing" | "done">("idle");
  const [clearError, setClearError] = useState<string | null>(null);
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
      {/* Profile Settings Block */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">User Profile — Account Management</div>
        <form onSubmit={handleProfileSave} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,220,90,0.8)", marginBottom: "4px" }}>
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
                background: "rgba(8,22,4,0.75)",
                border: "1px solid rgba(70,140,25,0.35)",
                color: "rgba(215,240,190,0.95)",
                fontSize: "0.85rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,220,90,0.8)", marginBottom: "4px" }}>
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
                background: "rgba(8,22,4,0.75)",
                border: "1px solid rgba(70,140,25,0.35)",
                color: "rgba(215,240,190,0.95)",
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

      {/* Currency */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Settings — Application Preferences</div>
        <div style={{ padding: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,220,90,0.8)", marginBottom: "4px" }}>
              Display Currency
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(150,190,110,0.6)", marginBottom: "14px", lineHeight: 1.5 }}>
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
                      background: isSelected ? "linear-gradient(to bottom, #8dda40 0%, #52a81c 100%)" : "rgba(20,50,8,0.6)",
                      color: isSelected ? "#fff" : "rgba(140,200,80,0.8)",
                      border: isSelected ? "1px solid rgba(160,230,80,0.5)" : "1px solid rgba(60,120,20,0.3)",
                      boxShadow: isSelected ? "0 0 8px rgba(80,180,20,0.4)" : "none",
                      textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                    }}>
                      {cur.symbol.length <= 2 ? cur.symbol : cur.code.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: isSelected ? "#c8eea0" : "rgba(190,225,150,0.85)", letterSpacing: "0.02em" }}>{cur.code}</div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(120,170,70,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur.name}</div>
                    </div>
                    {isSelected && <Check style={{ width: "13px", height: "13px", color: "#66c028", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid rgba(60,120,20,0.25)" }}>
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

      {/* Sound Settings */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Sound & Audio Feedback</div>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,220,90,0.8)", marginBottom: "4px" }}>
              Retro Sound Effects
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(150,190,110,0.6)", lineHeight: 1.5 }}>
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
                background: soundEnabled ? undefined : "linear-gradient(to bottom, rgba(50,80,20,0.2) 0%, rgba(20,40,10,0.3) 100%)",
                borderColor: soundEnabled ? undefined : "rgba(60,120,20,0.2)",
                color: soundEnabled ? "#fff" : "rgba(120,160,100,0.5)",
                boxShadow: soundEnabled ? undefined : "none",
              }}
            >
              {soundEnabled ? "🔊 Enabled" : "🔇 Disabled"}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
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

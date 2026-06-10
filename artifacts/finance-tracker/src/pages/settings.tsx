import { useState } from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { Check } from "lucide-react";

export default function Settings() {
  const { currency, setCurrency } = useCurrency();
  const [selected, setSelected] = useState(currency);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setCurrency(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Settings — Application Preferences</div>

        <div style={{ padding: "16px" }}>
          {/* Currency section */}
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    {/* Symbol badge */}
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      fontFamily: "monospace",
                      background: isSelected
                        ? "linear-gradient(to bottom, #8dda40 0%, #52a81c 100%)"
                        : "rgba(20, 50, 8, 0.6)",
                      color: isSelected ? "#fff" : "rgba(140,200,80,0.8)",
                      border: isSelected ? "1px solid rgba(160,230,80,0.5)" : "1px solid rgba(60,120,20,0.3)",
                      boxShadow: isSelected ? "0 0 8px rgba(80,180,20,0.4)" : "none",
                      textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                    }}>
                      {cur.symbol.length <= 2 ? cur.symbol : cur.code.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: isSelected ? "#c8eea0" : "rgba(190,225,150,0.85)", letterSpacing: "0.02em" }}>
                        {cur.code}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(120,170,70,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cur.name}
                      </div>
                    </div>
                    {isSelected && (
                      <Check style={{ width: "13px", height: "13px", color: "#66c028", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid rgba(60,120,20,0.25)" }}>
            <button
              className="glass-button"
              onClick={handleSave}
              style={{ padding: "6px 20px", borderRadius: "4px", fontSize: "0.8rem" }}
            >
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
    </div>
  );
}

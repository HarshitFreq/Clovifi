import { useListAccounts, getListAccountsQueryKey } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency";

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
  investment: "Investment",
  other: "Other",
};

export default function Accounts() {
  const { formatAmount } = useCurrency();
  const { data: accounts, isLoading } = useListAccounts({ query: { queryKey: getListAccountsQueryKey() } });

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Accounts — Balance Overview</span>
          <button className="glass-button" style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            + Add Account
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(130,180,80,0.55)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading accounts...
          </div>
        ) : accounts?.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.9rem" }}>No accounts yet.</div>
            <button className="glass-button" style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Account
            </button>
          </div>
        ) : (
          <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {accounts?.map(acc => (
              <div
                key={acc.id}
                className="glass-panel"
                style={{
                  borderRadius: "5px",
                  overflow: "hidden",
                  position: "relative",
                  transition: "box-shadow 0.2s",
                }}
              >
                {/* Color bar */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${acc.color || "#4da820"}, transparent)` }} />

                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#c8eea0", marginBottom: "2px" }}>{acc.name}</div>
                      <div style={{
                        display: "inline-block",
                        padding: "1px 7px",
                        borderRadius: "3px",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        background: `${acc.color || "#4da820"}25`,
                        color: acc.color || "#66c028",
                        border: `1px solid ${acc.color || "#4da820"}40`,
                      }}>
                        {TYPE_LABELS[acc.type] || acc.type}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: "1.55rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: acc.balance < 0 ? "#f87171" : "#c8eea0",
                    textShadow: acc.balance < 0
                      ? "0 0 14px rgba(220,60,60,0.35)"
                      : "0 0 14px rgba(100,200,40,0.35)",
                    letterSpacing: "-0.02em",
                  }}>
                    {formatAmount(acc.balance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {accounts && accounts.length > 0 && (
        <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
          <div className="panel-titlebar">Portfolio Summary</div>
          <div style={{ padding: "10px 14px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(130,190,80,0.65)", marginBottom: "3px" }}>Total Assets</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "#c8eea0" }}>
                {formatAmount(accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(200,80,80,0.65)", marginBottom: "3px" }}>Total Liabilities</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "#f87171" }}>
                {formatAmount(Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(130,190,80,0.65)", marginBottom: "3px" }}>Net Worth</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "#c8eea0" }}>
                {formatAmount(accounts.reduce((s, a) => s + a.balance, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(130,190,80,0.65)", marginBottom: "3px" }}>Accounts</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "#c8eea0" }}>{accounts.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

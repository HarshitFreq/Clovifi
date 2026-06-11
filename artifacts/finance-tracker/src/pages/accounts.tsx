import { useState } from "react";
import { useListAccounts, getListAccountsQueryKey } from "@workspace/api-client-react";
import type { Account } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency";
import AccountModal from "@/components/AccountModal";

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
  investment: "Investment",
};

export default function Accounts() {
  const { formatAmount } = useCurrency();
  const { data: accounts, isLoading } = useListAccounts({ query: { queryKey: getListAccountsQueryKey() } });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const openAdd = () => { setEditingAccount(null); setModalOpen(true); };
  const openEdit = (acc: Account) => { setEditingAccount(acc); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Accounts — Balance Overview</span>
          <button className="glass-button" onClick={openAdd} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            + Add Account
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading accounts…
          </div>
        ) : !Array.isArray(accounts) || accounts.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" }}>No accounts yet.</div>
            <button className="glass-button" onClick={openAdd} style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Account
            </button>
          </div>
        ) : (
          <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="glass-panel"
                onClick={() => openEdit(acc)}
                style={{
                  borderRadius: "5px",
                  overflow: "hidden",
                  position: "relative",
                  transition: "box-shadow 0.2s, transform 0.15s",
                  cursor: "pointer",
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${acc.color || "#4da820"}30, 0 8px 24px rgba(0,0,0,0.7)`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                {/* Color bar */}
                <div style={{ height: "3px", background: `linear-gradient(to right, ${acc.color || "#4da820"}, transparent)` }} />

                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--title-text)", marginBottom: "2px" }}>{acc.name}</div>
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
                    <div style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.45)", marginTop: "2px" }}>✎ edit</div>
                  </div>

                  <div style={{
                    fontSize: "1.55rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: acc.balance < 0 ? "#f87171" : "var(--accent-gradient-1)",
                    textShadow: acc.balance < 0
                      ? "0 0 14px rgba(220,60,60,0.35)"
                      : "0 0 14px var(--accent-glow-shadow)",
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
      {Array.isArray(accounts) && accounts.length > 0 && (
        <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
          <div className="panel-titlebar">Portfolio Summary</div>
          <div style={{ padding: "10px 14px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.45)", marginBottom: "3px" }}>Total Assets</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "var(--accent-gradient-1)" }}>
                {formatAmount(accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(239, 68, 68, 0.65)", marginBottom: "3px" }}>Total Liabilities</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "#f87171" }}>
                {formatAmount(Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.45)", marginBottom: "3px" }}>Net Worth</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "var(--accent-gradient-1)" }}>
                {formatAmount(accounts.reduce((s, a) => s + a.balance, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.45)", marginBottom: "3px" }}>Accounts</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1rem", color: "var(--title-text)" }}>{accounts.length}</div>
            </div>
          </div>
        </div>
      )}

      <AccountModal open={modalOpen} onClose={closeModal} account={editingAccount} />
    </div>
  );
}

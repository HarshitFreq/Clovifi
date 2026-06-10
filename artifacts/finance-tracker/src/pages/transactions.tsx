import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";

export default function Transactions() {
  const { formatAmount } = useCurrency();
  const { data: transactions, isLoading } = useListTransactions({}, { query: { queryKey: getListTransactionsQueryKey({}) } });

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Transactions — All Records</span>
          <button className="glass-button" style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            + Add Transaction
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(130,180,80,0.55)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading transactions...
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.9rem" }}>No transactions yet.</div>
            <button className="glass-button" style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Transaction
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(transactions) && transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: "rgba(160,210,100,0.75)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </td>
                    <td style={{ fontWeight: 500, color: "rgba(215,240,190,0.9)" }}>{t.description}</td>
                    <td>
                      {t.categoryName ? (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: `${t.categoryColor || "#4da820"}30`,
                          color: t.categoryColor || "#66c028",
                          border: `1px solid ${t.categoryColor || "#4da820"}50`,
                          letterSpacing: "0.04em",
                        }}>
                          {t.categoryName}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "rgba(100,140,60,0.45)", fontStyle: "italic" }}>Uncategorized</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "rgba(150,200,100,0.7)" }}>{t.accountName}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        background: t.type === "income" ? "rgba(50,180,60,0.15)" : "rgba(200,60,60,0.15)",
                        color: t.type === "income" ? "#6ee87a" : "#f87171",
                        border: `1px solid ${t.type === "income" ? "rgba(60,180,70,0.3)" : "rgba(200,60,60,0.3)"}`,
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: t.type === "income" ? "#6ee87a" : "#f87171", textShadow: t.type === "income" ? "0 0 8px rgba(60,200,80,0.4)" : "0 0 8px rgba(220,60,60,0.3)" }}>
                      {t.type === "income" ? "+" : "-"}{formatAmount(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

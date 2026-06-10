import { useState, useEffect } from "react";
import { listTransactions } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Preset = "this_month" | "last_month" | "last_30_days" | "last_90_days" | "custom";

const OVERLAY: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(0,0,0,0.72)",
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(6px)",
  animation: "fadeIn 0.15s ease",
};

const MODAL: React.CSSProperties = {
  background: "rgba(6,18,4,0.96)",
  border: "1px solid rgba(80,160,30,0.35)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(140,220,60,0.1)",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "420px",
  overflow: "hidden",
  animation: "slideUp 0.2s ease",
};

export default function ExportPdfModal({ open, onClose }: Props) {
  const { formatAmount, currency } = useCurrency();
  const [preset, setPreset] = useState<Preset>("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update dates based on preset
  useEffect(() => {
    const today = new Date();
    if (preset === "this_month") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
    } else if (preset === "last_month") {
      const lm = subMonths(today, 1);
      setStartDate(format(startOfMonth(lm), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(lm), "yyyy-MM-dd"));
    } else if (preset === "last_30_days") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "last_90_days") {
      setStartDate(format(subDays(today, 90), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "custom") {
      // Keep existing or default to empty
    }
  }, [preset, open]);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setError(null);

    // Open print window synchronously within the user-initiated click event to bypass popup blockers
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Popup blocked. Please allow popups to generate statement.");
      setLoading(false);
      return;
    }

    // Write a beautiful, themed loading indicator in the new tab/window
    printWindow.document.write(`
      <html>
        <head>
          <title>Generating Statement...</title>
          <style>
            body {
              font-family: 'Segoe UI', 'Trebuchet MS', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #fafdf8;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              color: #1b5a04;
            }
            .spinner {
              border: 4px solid rgba(102, 192, 40, 0.1);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border-left-color: #66c028;
              animation: spin 0.8s linear infinite;
              margin-bottom: 12px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .text { font-size: 0.95rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <div class="text">Generating Clovifi Statement...</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    try {
      // Fetch matching transactions from API
      const txs = await listTransactions({
        startDate: startDate,
        endDate: endDate,
        limit: 1000, // retrieve all matching transactions for statement
      });

      if (!txs || txs.length === 0) {
        printWindow.close();
        setError("No transactions found in this time frame.");
        setLoading(false);
        return;
      }

      // Compute stats
      let totalIncome = 0;
      let totalExpense = 0;
      txs.forEach((t) => {
        if (t.type === "income") {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
        }
      });
      const netSavings = totalIncome - totalExpense;

      const formattedStart = format(new Date(startDate), "MMM d, yyyy");
      const formattedEnd = format(new Date(endDate), "MMM d, yyyy");

      // Clear the loading state and write the actual content
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Clovifi Statement</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                padding: 3rem;
                line-height: 1.5;
                background-color: #ffffff;
                margin: 0;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #cbd5e1;
                padding-bottom: 1.5rem;
                margin-bottom: 2.5rem;
              }
              .title {
                font-size: 2rem;
                font-weight: 850;
                color: #1b5a04;
                letter-spacing: -0.02em;
                line-height: 1.1;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              }
              .subtitle {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 600;
                margin-top: 0.2rem;
              }
              .period-box {
                text-align: right;
              }
              .period-title {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                font-weight: 600;
              }
              .period-dates {
                font-size: 0.95rem;
                font-weight: 600;
                color: #0f172a;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5rem;
                margin-bottom: 2.5rem;
              }
              .card {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 1.25rem;
                background: #ffffff;
              }
              .card-title {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                margin-bottom: 0.5rem;
                font-weight: 600;
              }
              .card-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #0f172a;
              }
              .card-value.income { color: #15803d; }
              .card-value.expense { color: #b91c1c; }
              
              .section-title {
                font-size: 1.05rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 1rem;
                border-bottom: 1.5px solid #cbd5e1;
                padding-bottom: 0.5rem;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
              }
              .table th {
                text-align: left;
                padding: 0.75rem 1rem;
                background: #f8fafc;
                color: #475569;
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-bottom: 2px solid #cbd5e1;
                font-weight: 600;
              }
              .table tbody tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .table td {
                padding: 0.8rem 1rem;
                border-bottom: 1px solid #e2e8f0;
                font-size: 0.85rem;
                color: #334155;
              }
              .category-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.72rem;
                font-weight: 500;
              }
              .amount {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-weight: 600;
                text-align: right;
              }
              .amount.income { color: #15803d; }
              .amount.expense { color: #b91c1c; }
              .footer {
                margin-top: 4.5rem;
                text-align: center;
                font-size: 0.72rem;
                color: #94a3b8;
                border-top: 1px solid #cbd5e1;
                padding-top: 1.5rem;
              }
              @media print {
                body { background-color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .card { background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .table th { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">Clovifi</div>
                <div class="subtitle">Personal Statement</div>
              </div>
              
              <div class="period-box">
                <div class="period-title">Statement Period</div>
                <div class="period-dates">${formattedStart} – ${formattedEnd}</div>
              </div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <div class="card-title">Total Income</div>
                <div class="card-value income">+${formatAmount(totalIncome)}</div>
              </div>
              <div class="card">
                <div class="card-title">Total Expenses</div>
                <div class="card-value expense">-${formatAmount(totalExpense)}</div>
              </div>
              <div class="card">
                <div class="card-title">Net Flow</div>
                <div class="card-value ${netSavings >= 0 ? 'income' : 'expense'}">
                  ${netSavings >= 0 ? "+" : ""}${formatAmount(netSavings)}
                </div>
              </div>
            </div>

            <div class="section-title">Transactions Records (${txs.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 15%;">Date</th>
                  <th style="width: 40%;">Description</th>
                  <th style="width: 20%;">Category</th>
                  <th style="width: 15%;">Account</th>
                  <th style="width: 10%; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${txs
                  .map(
                    (t) => {
                      const hasCategory = !!t.categoryName;
                      const catColor = hasCategory ? (t.categoryColor || "#66c028") : "#64748b";
                      const catName = t.categoryName || "Uncategorized";
                      return `
                  <tr>
                    <td style="font-family: monospace; color: #4b6a3a; font-size: 0.78rem;">${format(
                      new Date(t.date),
                      "MMM d, yyyy"
                    )}</td>
                    <td style="font-weight: 600; color: #122c04;">${t.description}</td>
                    <td>
                      <span class="category-badge" style="background-color: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}35;">
                        ${catName}
                      </span>
                    </td>
                    <td style="color: #557245; font-size: 0.8rem; font-weight: 500;">${t.accountName}</td>
                    <td class="amount ${t.type}">
                      ${t.type === "income" ? "+" : "-"}${formatAmount(t.amount)}
                    </td>
                  </tr>
                `;
                    }
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="footer">
              Generated on ${format(
                new Date(),
                "MMMM d, yyyy h:mm a"
              )} — Currency in ${currency} — Statement powered by Clovifi
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 350);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      onClose();
    } catch (err) {
      if (printWindow) {
        try {
          printWindow.close();
        } catch (_) {}
      }
      setError(err instanceof Error ? err.message : "Failed to load statement transactions.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: "4px",
    background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)",
    color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none",
  };

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL}>
        {/* Title bar */}
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Export PDF Statement</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(180,220,120,0.6)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Timeframe Preset Selection */}
          <div>
            <label style={labelStyle}>Time Frame</label>
            <select style={inputStyle} value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {preset === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input style={inputStyle} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Preset Display dates */}
          {preset !== "custom" && startDate && endDate && (
            <div style={{ fontSize: "0.76rem", color: "rgba(150,200,100,0.6)", background: "rgba(8,22,4,0.4)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(60,120,20,0.18)" }}>
              Range: <span style={{ fontFamily: "monospace", color: "#c8eea0" }}>{format(new Date(startDate), "MMM d, yyyy")}</span> to <span style={{ fontFamily: "monospace", color: "#c8eea0" }}>{format(new Date(endDate), "MMM d, yyyy")}</span>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,60,60,0.3)", borderRadius: "4px", padding: "7px 10px", color: "#f87171", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(20,50,8,0.6)", border: "1px solid rgba(60,120,20,0.3)", color: "rgba(180,220,130,0.8)" }}>
              Cancel
            </button>
            <button onClick={handleGenerate} className="glass-button" disabled={loading}
              style={{ padding: "7px 18px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, minWidth: "120px" }}>
              {loading ? "Generating…" : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(2) hue-rotate(75deg); }
      `}</style>
    </div>
  );
}

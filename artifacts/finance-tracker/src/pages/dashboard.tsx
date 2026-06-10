import {
  useGetSummaryOverview, getGetSummaryOverviewQueryKey,
  useGetMonthlyTrend, getGetMonthlyTrendQueryKey,
  useGetRecentTransactions, getGetRecentTransactionsQueryKey,
  useGetSpendingByCategory, getGetSpendingByCategoryQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useCurrency } from "@/lib/currency";
import { format } from "date-fns";

const PIE_FALLBACK = ["#66c028","#f87171","#facc15","#60a5fa","#c084fc","#fb923c","#34d399","#f472b6"];

export default function Dashboard() {
  const { formatAmount } = useCurrency();
  const { data: summary, isLoading: isLoadingSummary } = useGetSummaryOverview({ query: { queryKey: getGetSummaryOverviewQueryKey() } });
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend({ months: 6 }, { query: { queryKey: getGetMonthlyTrendQueryKey({ months: 6 }) } });
  const { data: recent } = useGetRecentTransactions({ limit: 8 }, { query: { queryKey: getGetRecentTransactionsQueryKey({ limit: 8 }) } });
  const { data: spendingRaw } = useGetSpendingByCategory({}, { query: { queryKey: getGetSpendingByCategoryQueryKey({}) } });

  const spendingData = (spendingRaw ?? []).map((s, i) => ({
    name: s.categoryName,
    value: s.total,
    count: s.count,
    color: s.categoryColor || PIE_FALLBACK[i % PIE_FALLBACK.length],
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Title bar */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Dashboard — Financial Overview</div>
        <div style={{ padding: "10px 14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>

          {/* Stat: Total Balance */}
          <div className="glass-panel stat-card" style={{ flex: "1 1 160px", minWidth: "150px", borderRadius: "5px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(130,190,80,0.75)", marginBottom: "6px" }}>
              Total Balance
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c8eea0", textShadow: "0 0 12px rgba(100,200,40,0.4)" }}>
              {isLoadingSummary ? "—" : formatAmount(summary?.totalBalance ?? 0)}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(130,180,80,0.6)", marginTop: "4px" }}>
              {summary?.accountCount ?? 0} account{(summary?.accountCount ?? 0) !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Stat: Income */}
          <div className="glass-panel stat-card" style={{ flex: "1 1 160px", minWidth: "150px", borderRadius: "5px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(80,190,100,0.75)", marginBottom: "6px" }}>
              Income This Month
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6ee87a", textShadow: "0 0 12px rgba(60,200,80,0.35)" }}>
              +{isLoadingSummary ? "—" : formatAmount(summary?.totalIncomeThisMonth ?? 0)}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(80,170,90,0.6)", marginTop: "4px" }}>
              Net: {formatAmount(summary?.netThisMonth ?? 0)}
            </div>
          </div>

          {/* Stat: Expenses */}
          <div className="glass-panel stat-card" style={{ flex: "1 1 160px", minWidth: "150px", borderRadius: "5px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(220,80,80,0.75)", marginBottom: "6px" }}>
              Expenses This Month
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171", textShadow: "0 0 12px rgba(220,60,60,0.35)" }}>
              -{isLoadingSummary ? "—" : formatAmount(summary?.totalExpensesThisMonth ?? 0)}
            </div>
            {summary?.topExpenseCategory && (
              <div style={{ fontSize: "0.68rem", color: "rgba(210,120,100,0.7)", marginTop: "4px" }}>
                Top: {summary.topExpenseCategory}
              </div>
            )}
          </div>

          {/* Stat: Transactions */}
          <div className="glass-panel stat-card" style={{ flex: "1 1 130px", minWidth: "120px", borderRadius: "5px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(130,190,80,0.75)", marginBottom: "6px" }}>
              Total Transactions
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c8eea0", textShadow: "0 0 12px rgba(100,200,40,0.4)" }}>
              {isLoadingSummary ? "—" : summary?.transactionCount ?? 0}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(130,180,80,0.6)", marginTop: "4px" }}>all time</div>
          </div>

        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {/* Monthly Trend */}
        <div className="glass-panel" style={{ flex: "2 1 340px", borderRadius: "6px", overflow: "hidden" }}>
          <div className="panel-titlebar">Monthly Trend</div>
          <div style={{ padding: "12px", height: "240px" }}>
            {isLoadingTrend ? (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(130,180,80,0.6)", fontSize: "0.8rem" }}>
                Loading chart data...
              </div>
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#66c028" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#66c028" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(80,140,30,0.18)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(160,210,100,0.7)", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(160,210,100,0.7)", fontSize: 10 }} tickFormatter={(v) => formatAmount(v)} width={75} />
                  <Tooltip
                    contentStyle={{ background: "rgba(6,18,4,0.92)", border: "1px solid rgba(80,160,30,0.4)", borderRadius: "6px", fontSize: "0.78rem", backdropFilter: "blur(12px)" }}
                    labelStyle={{ color: "rgba(180,230,120,0.9)", fontWeight: 600 }}
                    itemStyle={{ color: "rgba(210,240,170,0.9)" }}
                    formatter={(v: number) => formatAmount(v)}
                  />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#66c028" strokeWidth={2} fill="url(#gIncome)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(130,180,80,0.5)", fontSize: "0.8rem" }}>
                No trend data yet
              </div>
            )}
          </div>
        </div>

        {/* Spending by Category */}
        <div className="glass-panel" style={{ flex: "1 1 240px", borderRadius: "6px", overflow: "hidden", minWidth: "220px", display: "flex", flexDirection: "column" }}>
          <div className="panel-titlebar">Spending by Category</div>

          {spendingData.length > 0 ? (
            <>
              {/* Donut chart */}
              <div style={{ height: "190px", padding: "8px 8px 0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {spendingData.map((entry, i) => (
                        <filter key={i} id={`glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      dataKey="value"
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {spendingData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={0.5}
                          style={{ filter: `drop-shadow(0 0 4px ${entry.color}99)` }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(4,14,2,0.96)",
                        border: "1px solid rgba(80,160,30,0.45)",
                        borderRadius: "5px",
                        fontSize: "0.74rem",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.8), 0 0 8px rgba(60,140,20,0.2)",
                        backdropFilter: "blur(14px)",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "rgba(180,230,120,0.9)", fontWeight: 700, marginBottom: "2px" }}
                      itemStyle={{ color: "rgba(200,235,160,0.85)" }}
                      formatter={(v: number, _name: string, props: { payload?: { count?: number } }) => [
                        <span style={{ fontFamily: "monospace", color: "#c8eea0" }}>{formatAmount(v)}</span>,
                        <span style={{ color: "rgba(150,200,90,0.75)", fontSize: "0.68rem" }}>
                          {props.payload?.count ?? ""} txn{(props.payload?.count ?? 0) !== 1 ? "s" : ""}
                        </span>,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom dark legend */}
              <div style={{
                padding: "6px 12px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                overflowY: "auto",
                maxHeight: "120px",
              }}>
                {spendingData.map((entry, i) => {
                  const total = spendingData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      {/* Color swatch */}
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        flexShrink: 0,
                        background: entry.color,
                        boxShadow: `0 0 5px ${entry.color}88`,
                      }} />
                      {/* Name */}
                      <div style={{
                        flex: 1,
                        fontSize: "0.7rem",
                        color: "rgba(190,230,145,0.85)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {entry.name}
                      </div>
                      {/* Percent */}
                      <div style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: entry.color,
                        textShadow: `0 0 6px ${entry.color}66`,
                        flexShrink: 0,
                      }}>
                        {pct}%
                      </div>
                      {/* Amount */}
                      <div style={{
                        fontSize: "0.68rem",
                        fontFamily: "monospace",
                        color: "rgba(160,205,105,0.65)",
                        flexShrink: 0,
                        minWidth: "60px",
                        textAlign: "right",
                      }}>
                        {formatAmount(entry.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(130,180,80,0.45)", fontSize: "0.8rem", textAlign: "center", padding: "2rem", lineHeight: 1.6 }}>
              Add expense transactions<br />to see breakdown
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">Recent Transactions</div>
        <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(!recent || recent.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "rgba(130,180,80,0.5)", padding: "2rem 1rem", fontStyle: "italic" }}>
                  No transactions yet
                </td>
              </tr>
            ) : recent.map(t => (
              <tr key={t.id}>
                <td style={{ color: "rgba(160,210,100,0.75)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                  {format(new Date(t.date), "MMM d, yyyy")}
                </td>
                <td style={{ fontWeight: 500, color: "rgba(215,240,190,0.9)" }}>{t.description}</td>
                <td>
                  {t.categoryName && (
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
                  )}
                </td>
                <td style={{ fontSize: "0.78rem", color: "rgba(150,200,100,0.7)" }}>{t.accountName}</td>
                <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: t.type === "income" ? "#6ee87a" : "#f87171", textShadow: t.type === "income" ? "0 0 8px rgba(60,200,80,0.4)" : "0 0 8px rgba(220,60,60,0.35)" }}>
                  {t.type === "income" ? "+" : "-"}{formatAmount(Math.abs(t.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import {
  useGetSummaryOverview, getGetSummaryOverviewQueryKey,
  useGetMonthlyTrend, getGetMonthlyTrendQueryKey,
  useGetRecentTransactions, getGetRecentTransactionsQueryKey,
  useGetSpendingByCategory, getGetSpendingByCategoryQueryKey,
  useGetMe,
  useListSubscriptions, getListSubscriptionsQueryKey,
  usePaySubscription,
  useListTransactions, getListTransactionsQueryKey,
  useListAccounts, getListAccountsQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useCurrency } from "@/lib/currency";
import { format, parseISO, differenceInDays, subDays, addDays, startOfWeek } from "date-fns";
import { useState, useMemo } from "react";
import {
  Plus, Clock, Check, ExternalLink, ChevronDown, ChevronUp,
  Flame, RefreshCw, FileSpreadsheet, Printer, WalletCards,
  TrendingUp, TrendingDown, Search, Landmark, Receipt,
  PieChart as PieIcon, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import TransactionModal from "@/components/TransactionModal";
import AccountModal from "@/components/AccountModal";
import ExportPdfModal from "@/components/ExportPdfModal";
import CategoryGlyph, { AccountTypeGlyph } from "@/components/CategoryGlyph";
import { useSoundEffects } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";

const PIE_FALLBACK = ["#66c028", "#f87171", "#facc15", "#60a5fa", "#c084fc", "#fb923c", "#34d399", "#f472b6"];

export default function Dashboard() {
  const { formatAmount } = useCurrency();
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "YTD" | "ALL">("6M");
  const [searchQuery, setSearchQuery] = useState("");

  const { playClick, playSuccess } = useSoundEffects();
  const { toast } = useToast();

  const trendMonths = timeRange === "1M" ? 1 : timeRange === "3M" ? 3 : timeRange === "6M" ? 6 : 12;

  // Data queries
  const { data: summary, isLoading: isLoadingSummary } = useGetSummaryOverview({
    query: { queryKey: getGetSummaryOverviewQueryKey() },
  });
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend(
    { months: trendMonths },
    { query: { queryKey: getGetMonthlyTrendQueryKey({ months: trendMonths }) } }
  );
  const { data: recent, isLoading: isLoadingRecent } = useGetRecentTransactions(
    { limit: 10 },
    { query: { queryKey: getGetRecentTransactionsQueryKey({ limit: 10 }) } }
  );
  const { data: spendingRaw } = useGetSpendingByCategory(
    {},
    { query: { queryKey: getGetSpendingByCategoryQueryKey({}) } }
  );
  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions({
    query: { queryKey: getListSubscriptionsQueryKey() },
  });
  const { data: accounts, isLoading: accountsLoading } = useListAccounts({
    query: { queryKey: getListAccountsQueryKey() },
  });

  // Pay subscription mutation
  const payMut = usePaySubscription({
    mutation: {
      onSuccess: (updatedSub) => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey({ limit: 10 }) });
        queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.("/api/summary") });
        playSuccess();
        toast({
          title: "Payment Recorded",
          description: `Logged transaction for ${updatedSub.name}. Next due date: ${format(
            new Date(updatedSub.nextDueDate),
            "MMM d, yyyy"
          )}.`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Payment Failed",
          description: err?.message || "An error occurred while logging payment.",
          variant: "destructive",
        });
      },
    },
  });

  const handleRefresh = async () => {
    playClick();
    await queryClient.invalidateQueries();
    playSuccess();
    toast({
      title: "Ledger Synchronized",
      description: "All accounts, balances, and reports have been refreshed.",
    });
  };

  const handleExportCSV = () => {
    playSuccess();
    const txList = recent || [];
    if (txList.length === 0) {
      toast({ title: "No Data", description: "No transactions found to export." });
      return;
    }
    const headers = ["ID", "Date", "Description", "Category", "Account", "Type", "Amount"];
    const rows = txList.map((t) => [
      t.id,
      format(new Date(t.date), "yyyy-MM-dd"),
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.categoryName || "").replace(/"/g, '""')}"`,
      `"${(t.accountName || "").replace(/"/g, '""')}"`,
      t.type,
      t.amount,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clovifi_ledger_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export Complete",
      description: "Downloaded ledger transactions to spreadsheet file.",
    });
  };

  // Filtered transactions for quick search
  const filteredRecent = useMemo(() => {
    const list = Array.isArray(recent) ? recent : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.categoryName?.toLowerCase().includes(q) ||
        t.accountName?.toLowerCase().includes(q)
    );
  }, [recent, searchQuery]);

  // Accounts summary calculations
  const accountsList = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);
  const totalAssets = useMemo(() => {
    return accountsList
      .filter((a) => a.type !== "credit_card")
      .reduce((sum, a) => sum + (typeof a.balance === "number" ? a.balance : parseFloat(a.balance as any) || 0), 0);
  }, [accountsList]);

  const totalDebts = useMemo(() => {
    return accountsList
      .filter((a) => a.type === "credit_card")
      .reduce((sum, a) => sum + Math.abs(typeof a.balance === "number" ? a.balance : parseFloat(a.balance as any) || 0), 0);
  }, [accountsList]);

  // Net Cash Flow metrics
  const incomeThisMonth = summary?.totalIncomeThisMonth ?? 0;
  const expensesThisMonth = summary?.totalExpensesThisMonth ?? 0;
  const netThisMonth = summary?.netThisMonth ?? (incomeThisMonth - expensesThisMonth);
  const savingsRate = incomeThisMonth > 0 ? Math.max(0, Math.round((netThisMonth / incomeThisMonth) * 100)) : 0;

  // Trend summary averages
  const trendList = Array.isArray(trend) ? trend : [];
  const avgMonthlyInflow = trendList.length > 0 ? trendList.reduce((s, t) => s + (t.income || 0), 0) / trendList.length : 0;
  const avgMonthlyOutflow = trendList.length > 0 ? trendList.reduce((s, t) => s + (t.expenses || 0), 0) / trendList.length : 0;

  // Spending categories data
  const spendingData = (Array.isArray(spendingRaw) ? spendingRaw : []).map((s, i) => ({
    name: s.categoryName,
    value: s.total,
    count: s.count,
    color: s.categoryColor || PIE_FALLBACK[i % PIE_FALLBACK.length],
  }));
  const totalCategorySpend = spendingData.reduce((sum, d) => sum + d.value, 0);

  // Subscriptions data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeSubs = (Array.isArray(subscriptions) ? subscriptions : [])
    .filter((s) => s.isActive)
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  const topUpcoming = activeSubs.slice(0, 4);
  const totalMonthlyRecurring = activeSubs.reduce((sum, s) => {
    if (s.type === "income") return sum;
    const factor = s.interval === "yearly" ? 1 / 12 : s.interval === "weekly" ? 52 / 12 : 1;
    return sum + (s.amount * factor);
  }, 0);

  // Heatmap configuration
  const startDate = startOfWeek(subDays(today, 21 * 7), { weekStartsOn: 0 });
  const endDate = today;
  const { data: heatmapTransactions } = useListTransactions(
    {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      type: "expense",
      limit: 1000,
    },
    {
      query: {
        queryKey: getListTransactionsQueryKey({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          type: "expense",
          limit: 1000,
        }),
      },
    }
  );

  const [hoveredCell, setHoveredCell] = useState<{ date: Date; amount: number; x: number; y: number } | null>(null);
  const daysRange = Array.from({ length: 154 }, (_, i) => addDays(startDate, i));
  const spendingDays = daysRange.map((day) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const txsOnDay = Array.isArray(heatmapTransactions)
      ? heatmapTransactions.filter((t) => t.date.slice(0, 10) === formattedDate)
      : [];
    const totalSpend = txsOnDay.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { date: day, totalSpend };
  });

  const maxSpend = Math.max(...spendingDays.map((d) => d.totalSpend), 0);
  const totalHistoryExpense = spendingDays.reduce((sum, d) => sum + d.totalSpend, 0);

  const spendingDaysWithLevels = spendingDays.map((day) => {
    let level = 0;
    if (day.totalSpend > 0) {
      if (maxSpend > 0) {
        const ratio = day.totalSpend / maxSpend;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      } else {
        level = 1;
      }
    }
    return { ...day, level };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Dialog Modals */}
      <TransactionModal open={isAddTxModalOpen} onClose={() => setIsAddTxModalOpen(false)} />
      <AccountModal open={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} />
      <ExportPdfModal open={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />

      {/* ── 1. Top Executive Toolbar ── */}
      <div className="toolbar-2010">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              playClick();
              setIsAddTxModalOpen(true);
            }}
            className="glass-button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "4px",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <Plus size={14} />
            <span>New Transaction</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setIsAddAccountModalOpen(true);
            }}
            className="toolbar-btn"
          >
            <WalletCards size={13} style={{ color: "var(--accent-gradient-1)" }} />
            <span>Add Account</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="toolbar-btn"
            title="Export Ledger to CSV / Excel Spreadsheet"
          >
            <FileSpreadsheet size={13} style={{ color: "#34d399" }} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setIsPdfModalOpen(true);
            }}
            className="toolbar-btn"
            title="Generate and Print PDF Financial Report"
          >
            <Printer size={13} style={{ color: "#60a5fa" }} />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleRefresh}
            className="toolbar-btn"
            title="Refresh Ledger and Recalculate Balances"
          >
            <RefreshCw size={12} style={{ color: "rgba(255,255,255,0.7)" }} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Timeframe Segmented Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Period:
          </span>
          <div className="segmented-group">
            {(["1M", "3M", "6M", "YTD", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  playClick();
                  setTimeRange(r);
                }}
                className={`segmented-btn ${timeRange === r ? "segmented-btn-active" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Top Financial KPI Summary Ribbon ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        {/* Total Net Worth */}
        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--title-text)" }}>
              Total Net Worth
            </span>
            <Landmark size={13} style={{ color: "var(--accent-gradient-1)", opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-gradient-1)", textShadow: "0 0 12px var(--accent-glow-shadow)" }}>
            {isLoadingSummary ? "—" : formatAmount(summary?.totalBalance ?? 0)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.45)", marginTop: "3px" }}>
            Across {summary?.accountCount ?? 0} active account{(summary?.accountCount ?? 0) !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Monthly Inflow */}
        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--title-text)" }}>
              Monthly Inflow
            </span>
            <ArrowDownLeft size={13} style={{ color: "#6ee87a" }} />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#6ee87a", textShadow: "0 0 12px rgba(60,200,80,0.35)" }}>
            +{isLoadingSummary ? "—" : formatAmount(incomeThisMonth)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.45)", marginTop: "3px" }}>
            Earnings & deposits this month
          </div>
        </div>

        {/* Monthly Outflow */}
        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(239, 100, 100, 0.85)" }}>
              Monthly Outflow
            </span>
            <ArrowUpRight size={13} style={{ color: "#f87171" }} />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f87171", textShadow: "0 0 12px rgba(220,60,60,0.35)" }}>
            -{isLoadingSummary ? "—" : formatAmount(expensesThisMonth)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(210,120,100,0.8)", marginTop: "3px" }}>
            {summary?.topExpenseCategory ? `Top: ${summary.topExpenseCategory}` : "No expenses recorded"}
          </div>
        </div>

        {/* Net Cash Flow & Savings Rate */}
        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--title-text)" }}>
              Net Cash Flow
            </span>
            {netThisMonth >= 0 ? (
              <TrendingUp size={13} style={{ color: "#6ee87a" }} />
            ) : (
              <TrendingDown size={13} style={{ color: "#f87171" }} />
            )}
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: netThisMonth >= 0 ? "#6ee87a" : "#f87171",
              textShadow: netThisMonth >= 0 ? "0 0 12px rgba(60,200,80,0.35)" : "0 0 12px rgba(220,60,60,0.35)",
            }}
          >
            {isLoadingSummary ? "—" : `${netThisMonth >= 0 ? "+" : ""}${formatAmount(netThisMonth)}`}
          </div>
          <div style={{ fontSize: "0.7rem", color: netThisMonth >= 0 ? "rgba(110,232,122,0.8)" : "rgba(248,113,113,0.8)", marginTop: "3px" }}>
            {incomeThisMonth > 0 ? `${savingsRate}% savings rate` : netThisMonth >= 0 ? "Balanced budget" : "Monthly deficit"}
          </div>
        </div>
      </div>

      {/* ── 3. High-Potential Desktop Grid: Operations (Left ~65%) + Financial Rail (Right ~35%) ── */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* ─── LEFT COLUMN: Cash Flow & Central Ledger Operations ─── */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3">
          {/* A. Cash Flow Trend Chart */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={13} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Monthly Cash Flow Trend</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                  Range: {timeRange}
                </span>
                <span
                  style={{
                    fontSize: "0.64rem",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--title-text)",
                    fontFamily: "monospace",
                  }}
                >
                  Net Avg: {formatAmount(avgMonthlyInflow - avgMonthlyOutflow)}/mo
                </span>
              </div>
            </div>

            <div style={{ padding: "12px", height: "230px" }}>
              {isLoadingTrend ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.8rem" }}>
                  Loading trend data...
                </div>
              ) : trendList.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendList} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-gradient-2)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--accent-gradient-2)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10 }} tickFormatter={(v) => formatAmount(v)} width={75} />
                    <Tooltip
                      contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", fontSize: "0.78rem", backdropFilter: "blur(12px)" }}
                      labelStyle={{ color: "var(--title-text)", fontWeight: 600 }}
                      itemStyle={{ color: "var(--title-text)" }}
                      formatter={(v: number) => formatAmount(v)}
                    />
                    <Area type="monotone" dataKey="income" name="Income" stroke="var(--accent-gradient-2)" strokeWidth={2} fill="url(#gIncome)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.8rem" }}>
                  No trend data recorded for selected period
                </div>
              )}
            </div>

            {/* Trend Summary Metric Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                borderTop: "1px solid var(--panel-border)",
                background: "rgba(0,0,0,0.2)",
                padding: "8px 14px",
                fontSize: "0.7rem",
              }}
            >
              <div>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: "5px" }}>Avg Inflow:</span>
                <span style={{ fontWeight: 700, color: "#6ee87a", fontFamily: "monospace" }}>+{formatAmount(avgMonthlyInflow)}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: "5px" }}>Avg Outflow:</span>
                <span style={{ fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>-{formatAmount(avgMonthlyOutflow)}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: "5px" }}>Net Margin:</span>
                <span style={{ fontWeight: 700, color: avgMonthlyInflow >= avgMonthlyOutflow ? "#6ee87a" : "#f87171", fontFamily: "monospace" }}>
                  {formatAmount(avgMonthlyInflow - avgMonthlyOutflow)}
                </span>
              </div>
            </div>
          </div>

          {/* B. Central Ledger Activity Table (Promoted & Expanded!) */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Receipt size={14} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Primary Ledger Activity</span>
                <span
                  style={{
                    fontSize: "0.64rem",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "monospace",
                  }}
                >
                  {filteredRecent.length} entries
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Search / Filter pill */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid var(--panel-border)",
                  }}
                >
                  <Search size={11} style={{ color: "rgba(255,255,255,0.5)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter ledger..."
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "0.7rem",
                      color: "#fff",
                      width: "105px",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.65rem", padding: "0 2px" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <Link href="/transactions" onClick={playClick}>
                  <div style={{ fontSize: "0.7rem", color: "var(--accent-gradient-1)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    Full Ledger <ExternalLink size={11} />
                  </div>
                </Link>
              </div>
            </div>

            <div style={{ overflowX: "auto", flex: 1 }}>
              <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "105px" }}>Date</th>
                    <th>Description / Payee</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th style={{ textAlign: "right", width: "115px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecent.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.4)", padding: "2.5rem 1rem", fontStyle: "italic" }}>
                        {searchQuery ? `No transactions matching "${searchQuery}"` : "No ledger transactions recorded yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredRecent.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.55)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          {format(new Date(t.date), "MMM d, yyyy")}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "rgba(255, 255, 255, 0.95)", fontSize: "0.8rem" }}>
                            {t.description}
                          </div>
                        </td>
                        <td>
                          {t.categoryName && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "2px 7px",
                                borderRadius: "3px",
                                fontSize: "0.66rem",
                                fontWeight: 600,
                                background: `${t.categoryColor || "#4da820"}25`,
                                color: t.categoryColor || "#66c028",
                                border: `1px solid ${t.categoryColor || "#4da820"}45`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CategoryGlyph icon={t.categoryIcon} name={t.categoryName} color={t.categoryColor || "#66c028"} size={11} />
                              <span>{t.categoryName}</span>
                            </span>
                          )}
                        </td>
                        <td>
                          {t.accountName && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                fontSize: "0.65rem",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.75)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Landmark size={10} style={{ color: "var(--accent-gradient-1)" }} />
                              <span>{t.accountName}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: "0.84rem", color: t.type === "income" ? "#6ee87a" : "#f87171", whiteSpace: "nowrap" }}>
                          {t.type === "income" ? "+" : "-"}{formatAmount(Math.abs(t.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with quick action */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderTop: "1px solid var(--panel-border)",
                background: "rgba(0,0,0,0.15)",
                fontSize: "0.72rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.45)" }}>
                Showing latest {filteredRecent.length} ledger movements
              </span>
              <button
                onClick={() => {
                  playClick();
                  setIsAddTxModalOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  color: "var(--accent-gradient-1)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.72rem",
                }}
              >
                <Plus size={12} />
                <span>Record New Transaction</span>
              </button>
            </div>
          </div>

          {/* C. Activity Heatmap Panel (Tucked below the table) */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
            <div
              onClick={() => {
                playClick();
                setShowHeatmap(!showHeatmap);
              }}
              className="panel-titlebar"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Flame size={14} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Spending Activity Heatmap</span>
                <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.45)", marginLeft: "4px" }}>
                  (Last 22 Weeks: {formatAmount(totalHistoryExpense)})
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>
                <span>{showHeatmap ? "Collapse" : "Expand"}</span>
                {showHeatmap ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </div>

            {showHeatmap && (
              <div style={{ padding: "12px 18px", overflowX: "auto" }}>
                <div style={{ minWidth: "350px", position: "relative" }}>
                  {/* Month labels header */}
                  <div style={{ display: "flex", gap: "3px", paddingLeft: "32px", marginBottom: "4px" }}>
                    {Array.from({ length: 22 }).map((_, w) => {
                      const weekSun = addDays(startDate, w * 7);
                      const isMonthStart = w === 0 || format(weekSun, "M") !== format(addDays(startDate, (w - 1) * 7), "M");
                      return (
                        <div key={w} style={{ width: "12px", fontSize: "0.58rem", color: "rgba(255,255,255,0.45)", textAlign: "center", flexShrink: 0 }}>
                          {isMonthStart ? format(weekSun, "MMM").slice(0, 3) : ""}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    {/* Weekday labels */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "102px", fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", width: "32px", paddingRight: "6px", textAlign: "right", flexShrink: 0 }}>
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    {/* Heatmap cells */}
                    <div style={{ display: "grid", gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column", gap: "3px" }}>
                      {spendingDaysWithLevels.map((dayData, idx) => {
                        let colorStop = "var(--heatmap-l0)";
                        if (dayData.level === 1) colorStop = "var(--heatmap-l1)";
                        else if (dayData.level === 2) colorStop = "var(--heatmap-l2)";
                        else if (dayData.level === 3) colorStop = "var(--heatmap-l3)";
                        else if (dayData.level === 4) colorStop = "var(--heatmap-l4)";

                        return (
                          <div
                            key={idx}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect();
                              if (parentRect) {
                                setHoveredCell({
                                  date: dayData.date,
                                  amount: dayData.totalSpend,
                                  x: rect.left - parentRect.left + rect.width / 2,
                                  y: rect.top - parentRect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              background: colorStop,
                              border: "1px solid rgba(0,0,0,0.15)",
                              cursor: "pointer",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend & Summary */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "10px", gap: "6px", fontSize: "0.62rem", color: "rgba(255,255,255,0.45)" }}>
                    <span>Less</span>
                    <div style={{ width: "9px", height: "9px", borderRadius: "1.5px", background: "var(--heatmap-l0)" }} />
                    <div style={{ width: "9px", height: "9px", borderRadius: "1.5px", background: "var(--heatmap-l1)" }} />
                    <div style={{ width: "9px", height: "9px", borderRadius: "1.5px", background: "var(--heatmap-l2)" }} />
                    <div style={{ width: "9px", height: "9px", borderRadius: "1.5px", background: "var(--heatmap-l3)" }} />
                    <div style={{ width: "9px", height: "9px", borderRadius: "1.5px", background: "var(--heatmap-l4)" }} />
                    <span>More</span>
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredCell && (
                    <div
                      style={{
                        position: "absolute",
                        left: hoveredCell.x,
                        top: hoveredCell.y - 40,
                        transform: "translateX(-50%)",
                        background: "rgba(10, 10, 10, 0.95)",
                        border: "1px solid var(--panel-border)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.7)",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "0.68rem",
                        color: "#fff",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        zIndex: 100,
                      }}
                    >
                      <strong style={{ color: "var(--accent-gradient-1)" }}>{formatAmount(hoveredCell.amount)}</strong> on {format(hoveredCell.date, "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT RAIL: Portfolio Snapshot & Obligations (Accounts + Breakdown + Bills) ─── */}
        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-3">
          {/* 1. Accounts & Balances Inspector Widget */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Landmark size={13} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Accounts & Balances</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => {
                    playClick();
                    setIsAddAccountModalOpen(true);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    color: "var(--accent-gradient-1)",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
                <Link href="/accounts" onClick={playClick}>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                    Manage <ExternalLink size={10} />
                  </div>
                </Link>
              </div>
            </div>

            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {accountsLoading ? (
                <div style={{ padding: "1.2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.76rem" }}>
                  Loading accounts...
                </div>
              ) : accountsList.length === 0 ? (
                <div style={{ padding: "1.2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.76rem" }}>
                  No accounts linked yet.
                </div>
              ) : (
                accountsList.map((acc) => {
                  const bal = typeof acc.balance === "number" ? acc.balance : parseFloat(acc.balance as any) || 0;
                  const isCredit = acc.type === "credit_card";

                  return (
                    <div
                      key={acc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 9px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.05)",
                            border: `1px solid ${acc.color || "var(--panel-border)"}40`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AccountTypeGlyph type={acc.type} color={acc.color || "#66c028"} size={13} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", textTransform: "capitalize" }}>
                            {acc.type}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: isCredit ? (bal > 0 ? "#f87171" : "#6ee87a") : "#fff" }}>
                          {formatAmount(bal)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Assets vs Liabilities Bar */}
            <div
              style={{
                borderTop: "1px solid var(--panel-border)",
                background: "rgba(0,0,0,0.2)",
                padding: "7px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.68rem",
              }}
            >
              <div>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: "4px" }}>Assets:</span>
                <span style={{ fontWeight: 700, color: "#6ee87a", fontFamily: "monospace" }}>{formatAmount(totalAssets)}</span>
              </div>
              <div>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: "4px" }}>Debts:</span>
                <span style={{ fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>{formatAmount(totalDebts)}</span>
              </div>
            </div>
          </div>

          {/* 2. Spending by Category Donut & Breakdown */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <PieIcon size={13} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Spending by Category</span>
              </div>
              <Link href="/categories" onClick={playClick}>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                  All <ExternalLink size={10} />
                </div>
              </Link>
            </div>

            {spendingData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ height: "165px", padding: "4px 8px 0" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius="48%"
                        outerRadius="74%"
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
                            style={{ filter: `drop-shadow(0 0 4px ${entry.color}88)` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--panel-bg)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "5px",
                          fontSize: "0.74rem",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.8)",
                          backdropFilter: "blur(14px)",
                          padding: "8px 12px",
                        }}
                        labelStyle={{ color: "var(--title-text)", fontWeight: 700 }}
                        itemStyle={{ color: "var(--title-text)" }}
                        formatter={(v: number, _name: string, props: { payload?: { count?: number } }) => [
                          <span style={{ fontFamily: "monospace", color: "var(--accent-gradient-1)" }}>{formatAmount(v)}</span>,
                          <span style={{ color: "var(--title-text)", opacity: 0.8, fontSize: "0.68rem" }}>
                            {props.payload?.count ?? ""} txn{(props.payload?.count ?? 0) !== 1 ? "s" : ""}
                          </span>,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Category Progress Bars */}
                <div
                  style={{
                    padding: "6px 12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    maxHeight: "160px",
                    overflowY: "auto",
                  }}
                >
                  {spendingData.map((entry, i) => {
                    const pct = totalCategorySpend > 0 ? ((entry.value / totalCategorySpend) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.7rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                            <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: entry.color, flexShrink: 0 }} />
                            <span style={{ color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {entry.name}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", fontSize: "0.68rem", flexShrink: 0 }}>
                            <span style={{ fontWeight: 700, color: entry.color }}>{pct}%</span>
                            <span style={{ color: "rgba(255,255,255,0.6)" }}>{formatAmount(entry.value)}</span>
                          </div>
                        </div>
                        {/* Progress meter */}
                        <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: entry.color, borderRadius: "2px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
                Add expense transactions to see category breakdown
              </div>
            )}
          </div>

          {/* 3. Upcoming Recurring Bills & Subscriptions */}
          <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={13} style={{ color: "var(--accent-gradient-1)" }} />
                <span>Upcoming Recurring Bills</span>
              </div>
              <Link href="/subscriptions" onClick={playClick}>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                  All ({activeSubs.length}) <ExternalLink size={10} />
                </div>
              </Link>
            </div>

            <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              {subsLoading ? (
                <div style={{ padding: "1.2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.76rem" }}>
                  Loading upcoming bills…
                </div>
              ) : topUpcoming.length === 0 ? (
                <div style={{ padding: "1.2rem 1rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.76rem" }}>No active recurring bills.</div>
                  <Link href="/subscriptions" onClick={playClick}>
                    <button className="glass-button" style={{ padding: "3px 10px", borderRadius: "3px", fontSize: "0.68rem" }}>
                      + Add Bill
                    </button>
                  </Link>
                </div>
              ) : (
                topUpcoming.map((sub) => {
                  const isPendingPay = payMut.isPending && payMut.variables?.id === sub.id;
                  const due = parseISO(sub.nextDueDate);
                  due.setHours(0, 0, 0, 0);
                  const diffDays = differenceInDays(due, today);

                  let dueLabel = "";
                  let dueBadgeColor = "rgba(255, 255, 255, 0.05)";
                  let dueTextColor = "rgba(255, 255, 255, 0.7)";

                  if (diffDays === 0) {
                    dueLabel = "Today";
                    dueBadgeColor = "rgba(234,179,8,0.2)";
                    dueTextColor = "#facc15";
                  } else if (diffDays < 0) {
                    dueLabel = "Overdue";
                    dueBadgeColor = "rgba(239,68,68,0.2)";
                    dueTextColor = "#f87171";
                  } else if (diffDays === 1) {
                    dueLabel = "Tomorrow";
                    dueBadgeColor = "var(--panel-border)";
                    dueTextColor = "var(--accent-gradient-1)";
                  } else {
                    dueLabel = `in ${diffDays}d`;
                  }

                  return (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 9px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            padding: "2px 5px",
                            borderRadius: "3px",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            background: dueBadgeColor,
                            color: dueTextColor,
                            fontFamily: "monospace",
                            flexShrink: 0,
                          }}
                        >
                          {dueLabel}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)", fontSize: "0.76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {sub.name}
                          </div>
                          <div style={{ fontSize: "0.62rem", color: "rgba(255, 255, 255, 0.45)", display: "flex", alignItems: "center", gap: "3px" }}>
                            <span>{format(new Date(sub.nextDueDate), "MMM d")}</span>
                            <span>·</span>
                            <span style={{ textTransform: "capitalize" }}>{sub.interval}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: sub.type === "income" ? "#6ee87a" : "#f87171" }}>
                          {sub.type === "income" ? "+" : "-"}{formatAmount(sub.amount)}
                        </span>
                        <button
                          onClick={() => payMut.mutate({ id: sub.id })}
                          disabled={isPendingPay}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "3px 7px",
                            borderRadius: "3px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--panel-border)",
                            color: "var(--accent-gradient-1)",
                            fontSize: "0.64rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isPendingPay ? "..." : <><Check size={10} /> Pay</>}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subscriptions Monthly Liability Footer */}
            <div
              style={{
                borderTop: "1px solid var(--panel-border)",
                background: "rgba(0,0,0,0.2)",
                padding: "7px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.68rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Monthly Recurring Commitments:</span>
              <span style={{ fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>~{formatAmount(totalMonthlyRecurring)}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  useGetSummaryOverview, getGetSummaryOverviewQueryKey,
  useGetMonthlyTrend, getGetMonthlyTrendQueryKey,
  useGetRecentTransactions, getGetRecentTransactionsQueryKey,
  useGetSpendingByCategory, getGetSpendingByCategoryQueryKey,
  useGetMe, useLogout,
  useListSubscriptions, getListSubscriptionsQueryKey,
  usePaySubscription,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useCurrency } from "@/lib/currency";
import { format, parseISO, differenceInDays, isToday } from "date-fns";
import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, GripHorizontal, User, LogOut, Calendar, Check, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingTour from "@/components/OnboardingTour";
import { useSoundEffects } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";

const PIE_FALLBACK = ["#66c028","#f87171","#facc15","#60a5fa","#c084fc","#fb923c","#34d399","#f472b6"];

export default function Dashboard() {
  const { formatAmount } = useCurrency();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [demoLoading, setDemoLoading] = useState(false);

  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions({
    query: { queryKey: getListSubscriptionsQueryKey() },
  });
  const { playSuccess } = useSoundEffects();
  const { toast } = useToast();

  const payMut = usePaySubscription({
    mutation: {
      onSuccess: (updatedSub) => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey({ limit: 8 }) });
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.("/api/summary") });
        playSuccess();
        toast({
          title: "Payment Logged! 🍀",
          description: `Logged transaction for ${updatedSub.name}. Next due date advanced to ${format(
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

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await fetch("/api/demo-data", { method: "POST" });
      queryClient.invalidateQueries();
    } finally {
      setDemoLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.clear();
      window.location.reload();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const { data: summary, isLoading: isLoadingSummary } = useGetSummaryOverview({ query: { queryKey: getGetSummaryOverviewQueryKey() } });
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend({ months: 6 }, { query: { queryKey: getGetMonthlyTrendQueryKey({ months: 6 }) } });
  const { data: recent } = useGetRecentTransactions({ limit: 8 }, { query: { queryKey: getGetRecentTransactionsQueryKey({ limit: 8 }) } });
  const { data: spendingRaw } = useGetSpendingByCategory({}, { query: { queryKey: getGetSpendingByCategoryQueryKey({}) } });

  const spendingData = (Array.isArray(spendingRaw) ? spendingRaw : []).map((s, i) => ({
    name: s.categoryName,
    value: s.total,
    count: s.count,
    color: s.categoryColor || PIE_FALLBACK[i % PIE_FALLBACK.length],
  }));

  // State for Main Widgets Order (vertical)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("clovifi_dashboard_order_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.includes("upcomingSubscriptions")) {
          const rtIndex = parsed.indexOf("recentTransactions");
          if (rtIndex !== -1) {
            parsed.splice(rtIndex, 0, "upcomingSubscriptions");
          } else {
            parsed.push("upcomingSubscriptions");
          }
          localStorage.setItem("clovifi_dashboard_order_v2", JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {}
    return ["stats", "charts", "upcomingSubscriptions", "recentTransactions"];
  });

  // State for Stat Cards Order (horizontal)
  const [statOrder, setStatOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("clovifi_stats_order");
      return saved ? JSON.parse(saved) : ["balance", "income", "expenses", "transactions"];
    } catch {
      return ["balance", "income", "expenses", "transactions"];
    }
  });

  // State for Charts Row Order (horizontal)
  const [chartsOrder, setChartsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("clovifi_charts_order");
      return saved ? JSON.parse(saved) : ["trendChart", "spendingChart"];
    } catch {
      return ["trendChart", "spendingChart"];
    }
  });

  const handleWidgetReorder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    try {
      localStorage.setItem("clovifi_dashboard_order_v2", JSON.stringify(newOrder));
    } catch (e) {
      console.error("Failed to save widget order:", e);
    }
  };

  const handleStatReorder = (newOrder: string[]) => {
    setStatOrder(newOrder);
    try {
      localStorage.setItem("clovifi_stats_order", JSON.stringify(newOrder));
    } catch (e) {
      console.error("Failed to save stat order:", e);
    }
  };

  const handleChartsReorder = (newOrder: string[]) => {
    setChartsOrder(newOrder);
    try {
      localStorage.setItem("clovifi_charts_order", JSON.stringify(newOrder));
    } catch (e) {
      console.error("Failed to save charts order:", e);
    }
  };

  // Drag controls map
  const dragControlsMap = {
    stats: useDragControls(),
    charts: useDragControls(),
    trendChart: useDragControls(),
    spendingChart: useDragControls(),
    upcomingSubscriptions: useDragControls(),
    recentTransactions: useDragControls(),
  };

  const renderStatCard = (id: string) => {
    const cardStyle = { flex: "1 1 160px", minWidth: "150px", borderRadius: "5px", padding: "12px 14px", cursor: "grab" };
    switch (id) {
      case "balance":
        return (
          <Reorder.Item
            key="balance"
            value="balance"
            as="div"
            whileDrag={{
              scale: 1.04,
              boxShadow: "0 15px 30px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
            }}
            className="glass-panel stat-card"
            style={cardStyle}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(130,190,80,0.75)", marginBottom: "6px" }}>
              Total Balance
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c8eea0", textShadow: "0 0 12px rgba(100,200,40,0.4)" }}>
              {isLoadingSummary ? "—" : formatAmount(summary?.totalBalance ?? 0)}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(130,180,80,0.6)", marginTop: "4px" }}>
              {summary?.accountCount ?? 0} account{(summary?.accountCount ?? 0) !== 1 ? "s" : ""}
            </div>
          </Reorder.Item>
        );
      case "income":
        return (
          <Reorder.Item
            key="income"
            value="income"
            as="div"
            whileDrag={{
              scale: 1.04,
              boxShadow: "0 15px 30px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
            }}
            className="glass-panel stat-card"
            style={cardStyle}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(80,190,100,0.75)", marginBottom: "6px" }}>
              Income This Month
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6ee87a", textShadow: "0 0 12px rgba(60,200,80,0.35)" }}>
              +{isLoadingSummary ? "—" : formatAmount(summary?.totalIncomeThisMonth ?? 0)}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(80,170,90,0.6)", marginTop: "4px" }}>
              Net: {formatAmount(summary?.netThisMonth ?? 0)}
            </div>
          </Reorder.Item>
        );
      case "expenses":
        return (
          <Reorder.Item
            key="expenses"
            value="expenses"
            as="div"
            whileDrag={{
              scale: 1.04,
              boxShadow: "0 15px 30px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
            }}
            className="glass-panel stat-card"
            style={cardStyle}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(220,80,80,0.75)", marginBottom: "6px" }}>
              Expenses This Month
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171", textShadow: "0 0 12px rgba(220,60,60,0.35)" }}>
              -{isLoadingSummary ? "—" : formatAmount(summary?.totalExpensesThisMonth ?? 0)}
            </div>
            {summary?.topExpenseCategory ? (
              <div style={{ fontSize: "0.68rem", color: "rgba(210,120,100,0.7)", marginTop: "4px" }}>
                Top: {summary.topExpenseCategory}
              </div>
            ) : (
              <div style={{ fontSize: "0.68rem", color: "rgba(210,120,100,0.7)", marginTop: "4px" }}>&nbsp;</div>
            )}
          </Reorder.Item>
        );
      case "transactions":
        return (
          <Reorder.Item
            key="transactions"
            value="transactions"
            as="div"
            whileDrag={{
              scale: 1.04,
              boxShadow: "0 15px 30px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
            }}
            className="glass-panel stat-card"
            style={cardStyle}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(130,190,80,0.75)", marginBottom: "6px" }}>
              Total Transactions
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#c8eea0", textShadow: "0 0 12px rgba(100,200,40,0.4)" }}>
              {isLoadingSummary ? "—" : summary?.transactionCount ?? 0}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(130,180,80,0.6)", marginTop: "4px" }}>all time</div>
          </Reorder.Item>
        );
      default:
        return null;
    }
  };

  const renderChartWidget = (id: string) => {
    switch (id) {
      case "trendChart":
        return (
          <Reorder.Item
            key="trendChart"
            value="trendChart"
            as="div"
            dragListener={false}
            dragControls={dragControlsMap.trendChart}
            whileDrag={{
              scale: 1.03,
              boxShadow: "0 15px 35px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
              zIndex: 60,
            }}
            className="glass-panel"
            style={{ flex: "2 1 340px", minWidth: "300px", borderRadius: "6px", overflow: "hidden" }}
          >
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Horizontal Drag Handle */}
                <div
                  style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.6 }}
                  onPointerDown={(e) => dragControlsMap.trendChart.start(e)}
                  title="Drag horizontally to swap charts"
                >
                  <GripHorizontal size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
                </div>
                <span>Monthly Trend</span>
              </div>
              
              {/* Vertical Drag Handle for the entire row */}
              <div
                style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.4 }}
                onPointerDown={(e) => dragControlsMap.charts.start(e)}
                title="Drag vertically to move the entire charts row"
              >
                <GripVertical size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
              </div>
            </div>
            
            <div style={{ padding: "12px", height: "240px" }}>
              {isLoadingTrend ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(130,180,80,0.6)", fontSize: "0.8rem" }}>
                  Loading chart data...
                </div>
              ) : Array.isArray(trend) && trend.length > 0 ? (
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
          </Reorder.Item>
        );
      case "spendingChart":
        return (
          <Reorder.Item
            key="spendingChart"
            value="spendingChart"
            as="div"
            dragListener={false}
            dragControls={dragControlsMap.spendingChart}
            whileDrag={{
              scale: 1.03,
              boxShadow: "0 15px 35px rgba(0,0,0,0.6), 0 0 12px rgba(100,220,40,0.4)",
              borderColor: "rgba(100,220,40,0.5)",
              zIndex: 60,
            }}
            className="glass-panel"
            style={{ flex: "1 1 240px", minWidth: "220px", borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Horizontal Drag Handle */}
                <div
                  style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.6 }}
                  onPointerDown={(e) => dragControlsMap.spendingChart.start(e)}
                  title="Drag horizontally to swap charts"
                >
                  <GripHorizontal size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
                </div>
                <span>Spending by Category</span>
              </div>
              
              {/* Vertical Drag Handle for the entire row */}
              <div
                style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.4 }}
                onPointerDown={(e) => dragControlsMap.charts.start(e)}
                title="Drag vertically to move the entire charts row"
              >
                <GripVertical size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
              </div>
            </div>

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
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          flexShrink: 0,
                          background: entry.color,
                          boxShadow: `0 0 5px ${entry.color}88`,
                        }} />
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
          </Reorder.Item>
        );
      default:
        return null;
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case "stats":
        return (
          <Reorder.Item
            key="stats"
            value="stats"
            as="div"
            dragListener={false}
            dragControls={dragControlsMap.stats}
            whileDrag={{
              scale: 1.01,
              boxShadow: "0 20px 40px rgba(0,0,0,0.65), 0 0 15px rgba(100,220,40,0.45)",
              borderColor: "rgba(100,220,40,0.55)",
              backgroundColor: "rgba(6,18,4,0.98)",
              zIndex: 50,
            }}
            className="glass-panel"
            style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.5 }}
                onPointerDown={(e) => dragControlsMap.stats.start(e)}
                title="Hold and drag to reorder stats section"
              >
                <GripVertical size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
              </div>
              <span>Overview Stats</span>
            </div>
            
            <Reorder.Group
              as="div"
              axis="x"
              values={statOrder}
              onReorder={handleStatReorder}
              style={{ padding: "10px 14px", display: "flex", gap: "10px", flexWrap: "wrap" }}
            >
              {statOrder.map(statId => renderStatCard(statId))}
            </Reorder.Group>
          </Reorder.Item>
        );
      case "charts":
        return (
          <Reorder.Item
            key="charts"
            value="charts"
            as="div"
            dragListener={false}
            dragControls={dragControlsMap.charts}
            whileDrag={{
              scale: 1.01,
              boxShadow: "0 20px 40px rgba(0,0,0,0.65), 0 0 15px rgba(100,220,40,0.45)",
              borderColor: "rgba(100,220,40,0.55)",
              backgroundColor: "rgba(6,18,4,0.98)",
              zIndex: 50,
            }}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Reorder.Group
              as="div"
              axis="x"
              values={chartsOrder}
              onReorder={handleChartsReorder}
              style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}
            >
              {chartsOrder.map(chartId => renderChartWidget(chartId))}
            </Reorder.Group>
          </Reorder.Item>
        );
      case "upcomingSubscriptions":
        {
          const activeSubs = (Array.isArray(subscriptions) ? subscriptions : [])
            .filter((s) => s.isActive)
            .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

          const topUpcoming = activeSubs.slice(0, 4);

          return (
            <Reorder.Item
              key="upcomingSubscriptions"
              value="upcomingSubscriptions"
              as="div"
              dragListener={false}
              dragControls={dragControlsMap.upcomingSubscriptions}
              whileDrag={{
                scale: 1.01,
                boxShadow: "0 20px 40px rgba(0,0,0,0.65), 0 0 15px rgba(100,220,40,0.45)",
                borderColor: "rgba(100,220,40,0.55)",
                backgroundColor: "rgba(6,18,4,0.98)",
                zIndex: 50,
              }}
              className="glass-panel"
              style={{ borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.5 }}
                    onPointerDown={(e) => dragControlsMap.upcomingSubscriptions.start(e)}
                    title="Hold and drag to reorder Upcoming Subscriptions"
                  >
                    <GripVertical size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
                  </div>
                  <span>Upcoming Bills & Subscriptions</span>
                </div>
                <Link href="/subscriptions">
                  <div style={{ fontSize: "0.72rem", color: "#66c028", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    Manage <ExternalLink size={10} />
                  </div>
                </Link>
              </div>

              <div style={{ padding: "8px 12px" }}>
                {subsLoading ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(130,180,80,0.5)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    Loading upcoming bills…
                  </div>
                ) : topUpcoming.length === 0 ? (
                  <div style={{ padding: "1.5rem 1rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ color: "rgba(130,180,80,0.5)", fontSize: "0.78rem" }}>No active recurring bills or subscriptions.</div>
                    <Link href="/subscriptions">
                      <button className="glass-button" style={{ padding: "4px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
                        + Set Up Subscription
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {topUpcoming.map((sub) => {
                      const isPendingPay = payMut.isPending && payMut.variables?.id === sub.id;
                      const catColor = sub.categoryColor || "#66c028";
                      
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const due = parseISO(sub.nextDueDate);
                      due.setHours(0, 0, 0, 0);
                      
                      const diffDays = differenceInDays(due, today);
                      
                      let dueLabel = "";
                      let dueBadgeColor = "rgba(160,210,100,0.15)";
                      let dueTextColor = "rgba(160,210,100,0.8)";
                      
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
                        dueBadgeColor = "rgba(160,210,100,0.2)";
                        dueTextColor = "#bef264";
                      } else {
                        dueLabel = `in ${diffDays} days`;
                      }

                      return (
                        <div
                          key={sub.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "200px", flex: "1 1 auto" }}>
                            <div
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                background: dueBadgeColor,
                                color: dueTextColor,
                                border: `1px solid ${dueTextColor}33`,
                                fontFamily: "monospace",
                                textAlign: "center",
                                minWidth: "72px",
                              }}
                            >
                              {dueLabel}
                            </div>
                            
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {sub.name}
                                </span>
                                {sub.categoryName && (
                                  <span
                                    style={{
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                      fontSize: "0.62rem",
                                      fontWeight: 600,
                                      background: `${catColor}15`,
                                      color: catColor,
                                      border: `1px solid ${catColor}30`,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {sub.categoryName}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "rgba(150,200,100,0.55)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                <Clock size={10} />
                                <span>Due {format(new Date(sub.nextDueDate), "MMM d, yyyy")} ({sub.interval})</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.88rem", color: sub.type === "income" ? "#6ee87a" : "#f87171" }}>
                              {sub.type === "income" ? "+" : "-"}{formatAmount(sub.amount)}
                            </span>
                            
                            <button
                              onClick={() => payMut.mutate({ id: sub.id })}
                              disabled={isPendingPay}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "rgba(102,192,40,0.15)",
                                border: "1px solid rgba(102,192,40,0.3)",
                                color: "#8ddf46",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                minWidth: "68px",
                              }}
                              onMouseEnter={(e) => {
                                if (!isPendingPay) {
                                  e.currentTarget.style.background = "rgba(102,192,40,0.3)";
                                  e.currentTarget.style.borderColor = "rgba(102,192,40,0.5)";
                                  e.currentTarget.style.color = "#fff";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isPendingPay) {
                                  e.currentTarget.style.background = "rgba(102,192,40,0.15)";
                                  e.currentTarget.style.borderColor = "rgba(102,192,40,0.3)";
                                  e.currentTarget.style.color = "#8ddf46";
                                }
                              }}
                            >
                              {isPendingPay ? (
                                "Logging..."
                              ) : (
                                <>
                                  <Check size={12} /> Pay
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Reorder.Item>
          );
        }
      case "recentTransactions":
        return (
          <Reorder.Item
            key="recentTransactions"
            value="recentTransactions"
            as="div"
            dragListener={false}
            dragControls={dragControlsMap.recentTransactions}
            whileDrag={{
              scale: 1.01,
              boxShadow: "0 20px 40px rgba(0,0,0,0.65), 0 0 15px rgba(100,220,40,0.45)",
              borderColor: "rgba(100,220,40,0.55)",
              backgroundColor: "rgba(6,18,4,0.98)",
              zIndex: 50,
            }}
            className="glass-panel"
            style={{ borderRadius: "6px", overflow: "hidden" }}
          >
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{ cursor: "grab", display: "flex", alignItems: "center", opacity: 0.5 }}
                onPointerDown={(e) => dragControlsMap.recentTransactions.start(e)}
                title="Hold and drag to reorder Recent Transactions"
              >
                <GripVertical size={14} style={{ color: "rgba(160,220,90,0.8)" }} />
              </div>
              <span>Recent Transactions</span>
            </div>
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
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
                  {(!Array.isArray(recent) || recent.length === 0) ? (
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
          </Reorder.Item>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <OnboardingTour onDemoLoad={handleLoadDemo} demoLoading={demoLoading} />
      {/* Welcome & Profile Header */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>Dashboard — Financial Overview</div>
          {user && (
            <div style={{ fontSize: "0.72rem", color: "rgba(160,220,90,0.8)", fontWeight: "normal" }}>
              Active Session: <strong style={{ color: "#fff" }}>{user.username}</strong>
            </div>
          )}
        </div>
        <div style={{
          background: "linear-gradient(180deg, rgba(10,35,5,0.4) 0%, rgba(5,15,2,0.6) 100%)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(to bottom, #ffffff 0%, #d5f2a2 60%, #66c028 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 1.5px 2px rgba(0,0,0,0.5))",
            }}>
              Welcome back, {user?.username || "Guest"}!
            </h1>
            <p style={{ fontSize: "0.8rem", color: "rgba(180,220,150,0.7)", margin: "4px 0 0" }}>
              Here is your financial status overview for today.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "4px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.3)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                e.currentTarget.style.color = "#fca5a5";
              }}
            >
              <LogOut style={{ width: "13px", height: "13px" }} />
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Reorderable widgets container */}
      <Reorder.Group
        as="div"
        axis="y"
        values={widgetOrder}
        onReorder={handleWidgetReorder}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {widgetOrder.map(widgetId => renderWidget(widgetId))}
      </Reorder.Group>
    </div>
  );
}

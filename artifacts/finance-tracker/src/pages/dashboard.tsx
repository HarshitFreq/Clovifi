import { useGetSummaryOverview, getGetSummaryOverviewQueryKey, useGetMonthlyTrend, getGetMonthlyTrendQueryKey } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/lib/currency";

export default function Dashboard() {
  const { formatAmount } = useCurrency();
  const { data: summary, isLoading: isLoadingSummary } = useGetSummaryOverview({ query: { queryKey: getGetSummaryOverviewQueryKey() } });
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend({ months: 6 }, { query: { queryKey: getGetMonthlyTrendQueryKey({ months: 6 }) } });

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Dashboard</h2>
          <p className="text-slate-600 font-medium">Welcome back. Here's your financial overview.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <p className="text-slate-600 font-medium text-sm uppercase tracking-wider">Total Balance</p>
          <div className="text-3xl font-bold text-slate-800 drop-shadow-sm">
            {isLoadingSummary ? "..." : formatAmount(summary?.totalBalance ?? 0)}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <p className="text-slate-600 font-medium text-sm uppercase tracking-wider">Income This Month</p>
          <div className="text-3xl font-bold text-green-700 drop-shadow-sm">
            {isLoadingSummary ? "..." : `+${formatAmount(summary?.totalIncomeThisMonth ?? 0)}`}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <p className="text-slate-600 font-medium text-sm uppercase tracking-wider">Expenses This Month</p>
          <div className="text-3xl font-bold text-red-600 drop-shadow-sm">
            {isLoadingSummary ? "..." : `-${formatAmount(summary?.totalExpensesThisMonth ?? 0)}`}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 h-[400px]">
        <h3 className="text-lg font-bold text-slate-800">Monthly Trend</h3>
        <div className="flex-1 w-full h-full min-h-0">
          {isLoadingTrend ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500">Loading chart...</div>
          ) : trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569' }}
                  tickFormatter={(v) => formatAmount(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => formatAmount(value)}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

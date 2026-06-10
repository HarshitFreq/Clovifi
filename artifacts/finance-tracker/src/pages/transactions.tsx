import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions({}, { query: { queryKey: getListTransactionsQueryKey({}) } });

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Transactions</h2>
        <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add Transaction</button>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : transactions?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <p className="text-slate-600">No transactions yet.</p>
            <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add First Transaction</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/40 bg-white/20">
                  <th className="p-4 font-bold text-slate-700">Date</th>
                  <th className="p-4 font-bold text-slate-700">Description</th>
                  <th className="p-4 font-bold text-slate-700">Category</th>
                  <th className="p-4 font-bold text-slate-700">Account</th>
                  <th className="p-4 font-bold text-slate-700 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((t) => (
                  <tr key={t.id} className="border-b border-white/20 hover:bg-white/30 transition-colors">
                    <td className="p-4 text-slate-700">{format(new Date(t.date), "MMM d, yyyy")}</td>
                    <td className="p-4 font-medium text-slate-800">{t.description}</td>
                    <td className="p-4">
                      {t.categoryName && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${t.categoryColor || '#cbd5e1'}40`, color: t.categoryColor || '#475569' }}>
                          {t.categoryName}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{t.accountName}</td>
                    <td className={`p-4 text-right font-bold drop-shadow-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
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

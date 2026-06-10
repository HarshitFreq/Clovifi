import { useListAccounts, getListAccountsQueryKey } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency";

export default function Accounts() {
  const { formatAmount } = useCurrency();
  const { data: accounts, isLoading } = useListAccounts({ query: { queryKey: getListAccountsQueryKey() } });

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Accounts</h2>
        <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add Account</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-slate-500">Loading...</div>
        ) : accounts?.length === 0 ? (
          <div className="col-span-full p-12 glass-panel rounded-2xl text-center flex flex-col items-center gap-4">
            <p className="text-slate-600">No accounts yet.</p>
            <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add First Account</button>
          </div>
        ) : (
          accounts?.map(acc => (
            <div key={acc.id} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 hover:shadow-lg transition-shadow relative overflow-hidden group">
              <div
                className="absolute top-0 left-0 w-1 h-full opacity-80"
                style={{ backgroundColor: acc.color || '#60A5FA' }}
              />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{acc.name}</h3>
                  <p className="text-sm text-slate-500 uppercase tracking-wider">{acc.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className={`text-3xl font-bold drop-shadow-sm ${acc.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatAmount(acc.balance)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

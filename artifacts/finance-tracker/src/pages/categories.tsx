import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Categories</h2>
        <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add Category</button>
      </header>

      <div className="glass-panel rounded-2xl p-6">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : categories?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <p className="text-slate-600">No categories yet.</p>
            <button className="glass-button px-4 py-2 rounded-xl font-bold text-sm">Add First Category</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories?.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/20 border border-white/40 hover:bg-white/40 transition-colors cursor-pointer">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm border border-white/60 flex-shrink-0" 
                  style={{ backgroundColor: cat.color }} 
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 truncate">{cat.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{cat.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

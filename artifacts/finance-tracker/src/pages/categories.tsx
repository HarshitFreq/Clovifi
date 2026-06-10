import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";

const TYPE_COLORS: Record<string, string> = {
  expense: "#f87171",
  income: "#6ee87a",
  both: "#66c028",
};

export default function Categories() {
  const { data: categories, isLoading } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const expenses = categories?.filter(c => c.type === "expense" || c.type === "both") ?? [];
  const income = categories?.filter(c => c.type === "income" || c.type === "both") ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Categories — Expense &amp; Income Tags</span>
          <button className="glass-button" style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            + Add Category
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(130,180,80,0.55)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading categories...
          </div>
        ) : categories?.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.9rem" }}>No categories yet.</div>
            <button className="glass-button" style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Category
            </button>
          </div>
        ) : (
          <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

            {/* Expense categories */}
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(220,100,100,0.75)", marginBottom: "8px", paddingLeft: "4px" }}>
                Expense Categories
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {expenses.length === 0 ? (
                  <div style={{ color: "rgba(130,180,80,0.4)", fontSize: "0.78rem", fontStyle: "italic", padding: "8px 4px" }}>None yet</div>
                ) : expenses.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 10px",
                      borderRadius: "4px",
                      background: "rgba(10,25,6,0.5)",
                      border: `1px solid ${cat.color}28`,
                      cursor: "pointer",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(20,50,8,0.7)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}50`; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(10,25,6,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}28`; }}
                  >
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: cat.color, flexShrink: 0, boxShadow: `0 0 6px ${cat.color}80` }} />
                    <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "rgba(210,235,185,0.9)" }}>{cat.name}</div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[cat.type] || "#66c028", opacity: 0.8 }}>
                      {cat.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Income categories */}
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(80,210,100,0.75)", marginBottom: "8px", paddingLeft: "4px" }}>
                Income Categories
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {income.length === 0 ? (
                  <div style={{ color: "rgba(130,180,80,0.4)", fontSize: "0.78rem", fontStyle: "italic", padding: "8px 4px" }}>None yet</div>
                ) : income.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 10px",
                      borderRadius: "4px",
                      background: "rgba(10,25,6,0.5)",
                      border: `1px solid ${cat.color}28`,
                      cursor: "pointer",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(20,50,8,0.7)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}50`; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(10,25,6,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}28`; }}
                  >
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: cat.color, flexShrink: 0, boxShadow: `0 0 6px ${cat.color}80` }} />
                    <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "rgba(210,235,185,0.9)" }}>{cat.name}</div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[cat.type] || "#66c028", opacity: 0.8 }}>
                      {cat.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

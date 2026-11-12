import { useState } from "react";
import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";
import CategoryModal from "@/components/CategoryModal";
import CategoryGlyph from "@/components/CategoryGlyph";
import { Edit3 } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  expense: "#f87171",
  income: "#6ee87a",
  both: "#66c028",
};

export default function Categories() {
  const { data: categories, isLoading } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const openAdd = () => { setEditingCategory(null); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditingCategory(cat); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const expenses = Array.isArray(categories) ? categories.filter(c => c.type === "expense" || c.type === "both") : [];
  const income = Array.isArray(categories) ? categories.filter(c => c.type === "income" || c.type === "both") : [];

  const buildHierarchicalList = (list: Category[]) => {
    const parents = list.filter(c => !c.parentId);
    const children = list.filter(c => c.parentId);
    
    const childrenMap: Record<number, Category[]> = {};
    children.forEach(child => {
      const pid = child.parentId!;
      if (!childrenMap[pid]) {
        childrenMap[pid] = [];
      }
      childrenMap[pid].push(child);
    });

    const parentIds = new Set(parents.map(p => p.id));
    const orphans = children.filter(c => !parentIds.has(c.parentId!));

    return { parents, childrenMap, orphans };
  };

  const expenseTree = buildHierarchicalList(expenses);
  const incomeTree = buildHierarchicalList(income);

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Categories — Expense &amp; Income Tags</span>
          <button className="glass-button" onClick={openAdd} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            + Add Category
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading categories…
          </div>
        ) : !Array.isArray(categories) || categories.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" }}>No categories yet.</div>
            <button className="glass-button" onClick={openAdd} style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
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
                  <div style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.78rem", fontStyle: "italic", padding: "8px 4px" }}>None yet</div>
                ) : (
                  <>
                    {expenseTree.parents.map(parent => (
                      <div key={parent.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div
                          onClick={() => openEdit(parent)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "7px 10px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${parent.color}28`,
                            cursor: "pointer",
                            transition: "background 0.12s, border-color 0.12s",
                          }}
                          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)"; (e.currentTarget as HTMLElement).style.borderColor = `${parent.color}28`; }}
                        >
                          <CategoryGlyph icon={parent.icon} name={parent.name} color={parent.color} size={12} badge />
                          <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>{parent.name}</div>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[parent.type] || "#66c028", opacity: 0.8 }}>
                            {parent.type}
                          </div>
                          <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                        </div>

                        {(expenseTree.childrenMap[parent.id] || []).map(child => (
                          <div
                            key={child.id}
                            onClick={() => openEdit(child)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              background: "rgba(0, 0, 0, 0.15)",
                              border: `1px solid ${child.color}15`,
                              cursor: "pointer",
                              transition: "background 0.12s, border-color 0.12s",
                              marginLeft: "18px",
                            }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.15)"; (e.currentTarget as HTMLElement).style.borderColor = `${child.color}15`; }}
                          >
                            <span style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "0.85rem", transform: "translateY(-2px)" }}>↳</span>
                            <CategoryGlyph icon={child.icon} name={child.name} color={child.color} size={11} badge />
                            <div style={{ flex: 1, fontSize: "0.78rem", fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>{child.name}</div>
                            <div style={{ fontSize: "0.58rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                          </div>
                        ))}
                      </div>
                    ))}

                    {expenseTree.orphans.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => openEdit(cat)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${cat.color}28`,
                          cursor: "pointer",
                          transition: "background 0.12s, border-color 0.12s",
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}28`; }}
                      >
                        <CategoryGlyph icon={cat.icon} name={cat.name} color={cat.color} size={12} badge />
                        <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "rgba(255, 255, 255, 0.9)" }}>{cat.name}</div>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[cat.type] || "#66c028", opacity: 0.8 }}>
                          {cat.type}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Income categories */}
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(80,210,100,0.75)", marginBottom: "8px", paddingLeft: "4px" }}>
                Income Categories
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {income.length === 0 ? (
                  <div style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.78rem", fontStyle: "italic", padding: "8px 4px" }}>None yet</div>
                ) : (
                  <>
                    {incomeTree.parents.map(parent => (
                      <div key={parent.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div
                          onClick={() => openEdit(parent)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "7px 10px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${parent.color}28`,
                            cursor: "pointer",
                            transition: "background 0.12s, border-color 0.12s",
                          }}
                          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)"; (e.currentTarget as HTMLElement).style.borderColor = `${parent.color}28`; }}
                        >
                          <CategoryGlyph icon={parent.icon} name={parent.name} color={parent.color} size={12} badge />
                          <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>{parent.name}</div>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[parent.type] || "#66c028", opacity: 0.8 }}>
                            {parent.type}
                          </div>
                          <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                        </div>

                        {(incomeTree.childrenMap[parent.id] || []).map(child => (
                          <div
                            key={child.id}
                            onClick={() => openEdit(child)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              background: "rgba(0, 0, 0, 0.15)",
                              border: `1px solid ${child.color}15`,
                              cursor: "pointer",
                              transition: "background 0.12s, border-color 0.12s",
                              marginLeft: "18px",
                            }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.15)"; (e.currentTarget as HTMLElement).style.borderColor = `${child.color}15`; }}
                          >
                            <span style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "0.85rem", transform: "translateY(-2px)" }}>↳</span>
                            <CategoryGlyph icon={child.icon} name={child.name} color={child.color} size={11} badge />
                            <div style={{ flex: 1, fontSize: "0.78rem", fontWeight: 500, color: "rgba(255, 255, 255, 0.85)" }}>{child.name}</div>
                            <div style={{ fontSize: "0.58rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                          </div>
                        ))}
                      </div>
                    ))}

                    {incomeTree.orphans.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => openEdit(cat)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${cat.color}28`,
                          cursor: "pointer",
                          transition: "background 0.12s, border-color 0.12s",
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border-color)"; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)"; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}28`; }}
                      >
                        <CategoryGlyph icon={cat.icon} name={cat.name} color={cat.color} size={12} badge />
                        <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "rgba(255, 255, 255, 0.9)" }}>{cat.name}</div>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TYPE_COLORS[cat.type] || "#66c028", opacity: 0.8 }}>
                          {cat.type}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", display: "flex", alignItems: "center" }}><Edit3 size={11} /></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      <CategoryModal open={modalOpen} onClose={closeModal} category={editingCategory} />
    </div>
  );
}

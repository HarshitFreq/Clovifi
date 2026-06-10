import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useListCategories,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSoundEffects } from "@/lib/sound";

const CATEGORY_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "both", label: "Both" },
] as const;

const PRESET_COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80",
  "#34d399", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6",
  "#4da820", "#66c028",
];

interface Props {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

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
  maxWidth: "380px",
  overflow: "hidden",
  animation: "slideUp 0.2s ease",
};

export default function CategoryModal({ open, onClose, category }: Props) {
  const isEdit = !!category;
  const qc = useQueryClient();
  const { playSuccess, playWarning } = useSoundEffects();

  const { data: allCategories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<typeof CATEGORY_TYPES[number]["value"]>("expense");
  const [color, setColor] = useState("#f87171");
  const [parentId, setParentId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setType((category?.type as typeof CATEGORY_TYPES[number]["value"]) ?? "expense");
      setColor(category?.color ?? "#f87171");
      setParentId(category?.parentId ?? "");
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, category]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const createMut = useCreateCategory({ mutation: { onSuccess: () => { invalidate(); playSuccess(); onClose(); } } });
  const updateMut = useUpdateCategory({ mutation: { onSuccess: () => { invalidate(); playSuccess(); onClose(); } } });
  const deleteMut = useDeleteCategory({ mutation: { onSuccess: () => { invalidate(); playWarning(); onClose(); } } });

  const isPending = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const handleTypeChange = (newType: typeof CATEGORY_TYPES[number]["value"]) => {
    setType(newType);
    setParentId(""); // Reset parent since it might be type-incompatible
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Category name is required."); return; }

    const payload = {
      name: name.trim(),
      type,
      color,
      parentId: parentId !== "" ? Number(parentId) : null,
    };
    if (isEdit) {
      updateMut.mutate({ id: category!.id, data: payload }, {
        onError: () => setError("Failed to update category."),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onError: () => setError("Failed to create category."),
      });
    }
  };

  const availableParents = Array.isArray(allCategories)
    ? allCategories.filter((c) => {
        if (category && c.id === category.id) return false;
        if (c.parentId) return false; // Parents themselves cannot have parentId
        return c.type === "both" || c.type === type;
      })
    : [];

  if (!open) return null;

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
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{isEdit ? "Edit Category" : "Add Category"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(180,220,120,0.6)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Category Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Groceries" autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {CATEGORY_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
                  style={{
                    flex: 1, padding: "7px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    background: type === t.value ? "rgba(60,130,20,0.4)" : "rgba(12,30,6,0.6)",
                    border: type === t.value ? "1px solid rgba(100,190,40,0.6)" : "1px solid rgba(50,100,15,0.3)",
                    color: type === t.value ? "#c8eea0" : "rgba(150,190,100,0.6)",
                    transition: "all 0.12s",
                    boxShadow: type === t.value ? "0 0 8px rgba(80,180,20,0.2)" : "none",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Parent Category (Optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value !== "" ? Number(e.target.value) : "")}
              style={inputStyle}
            >
              <option value="">None (Top-Level Category)</option>
              {availableParents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%", background: c, border: "none",
                    cursor: "pointer", flexShrink: 0,
                    boxShadow: color === c ? `0 0 0 2.5px rgba(255,255,255,0.75), 0 0 8px ${c}80` : "none",
                    transform: color === c ? "scale(1.25)" : "scale(1)",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: "28px", height: "22px", border: "1px solid rgba(70,140,25,0.4)", borderRadius: "50%", background: "transparent", cursor: "pointer", padding: "0" }} />
            </div>
          </div>

          {/* Live preview */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "5px", background: "rgba(8,22,4,0.6)", border: `1px solid ${color}28` }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}80`, flexShrink: 0 }} />
            <span style={{ fontSize: "0.82rem", color: "rgba(210,235,185,0.85)", flex: 1 }}>{name || "Category preview"}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color, opacity: 0.85 }}>{type}</span>
          </div>

          {error && (
            <div style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,60,60,0.3)", borderRadius: "4px", padding: "7px 10px", color: "#f87171", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            {isEdit && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,30,30,0.15)", border: "1px solid rgba(200,50,50,0.3)", color: "#f87171" }}>
                Delete
              </button>
            )}
            {confirmDelete && (
              <button type="button" onClick={() => deleteMut.mutate({ id: category!.id })} disabled={isPending}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "rgba(200,40,40,0.35)", border: "1px solid rgba(220,60,60,0.5)", color: "#fca5a5" }}>
                {isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            )}
            <button type="button" onClick={onClose}
              style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(20,50,8,0.6)", border: "1px solid rgba(60,120,20,0.3)", color: "rgba(180,220,130,0.8)" }}>
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={isPending}
              style={{ padding: "7px 18px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              {isPending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Add Category")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

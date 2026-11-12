import { useState, useEffect } from "react";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useListAccounts,
  useListCategories,
  getListTransactionsQueryKey,
  getListAccountsQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSoundEffects } from "@/lib/sound";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const OVERLAY: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(0,0,0,0.72)",
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(6px)",
  padding: "0.75rem",
  animation: "fadeIn 0.15s ease",
};

const MODAL: React.CSSProperties = {
  background: "var(--panel-bg)",
  border: "1px solid var(--panel-border)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.85), inset 0 1px 0 var(--panel-border)",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "460px",
  maxHeight: "92dvh",
  overflowY: "auto",
  animation: "slideUp 0.2s ease",
};



export default function TransactionModal({ open, onClose, transaction }: Props) {
  const isEdit = !!transaction;
  const qc = useQueryClient();
  const { playSuccess, playWarning } = useSoundEffects();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [accountId, setAccountId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: accounts } = useListAccounts({ query: { queryKey: getListAccountsQueryKey() } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const filteredCategories = Array.isArray(categories)
    ? categories.filter(c => c.type === type || c.type === "both")
    : [];

  useEffect(() => {
    if (open) {
      setAmount(transaction ? String(transaction.amount) : "");
      setDescription(transaction?.description ?? "");
      setType((transaction?.type as "expense" | "income") ?? "expense");
      setDate(transaction?.date ?? format(new Date(), "yyyy-MM-dd"));
      setAccountId(transaction?.accountId ?? (Array.isArray(accounts) && accounts.length > 0 ? accounts[0].id : ""));
      setCategoryId(transaction?.categoryId ?? "");
      setNotes(transaction?.notes ?? "");
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, transaction]);

  // When accounts load and no account set yet, prefill with first
  useEffect(() => {
    if (!isEdit && Array.isArray(accounts) && accounts.length > 0 && accountId === "") {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListTransactionsQueryKey({}) });
    qc.invalidateQueries({ queryKey: getListAccountsQueryKey() });
    // Also bust dashboard summary caches by prefix
    qc.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.("/api/summary") });
  };

  const createMut = useCreateTransaction({ mutation: { onSuccess: () => { invalidateAll(); playSuccess(); onClose(); } } });
  const updateMut = useUpdateTransaction({ mutation: { onSuccess: () => { invalidateAll(); playSuccess(); onClose(); } } });
  const deleteMut = useDeleteTransaction({ mutation: { onSuccess: () => { invalidateAll(); playWarning(); onClose(); } } });

  const isPending = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount);
    if (!description.trim()) { setError("Description is required."); return; }
    if (isNaN(amt) || amt <= 0) { setError("Amount must be a positive number."); return; }
    if (accountId === "") { setError("Please select an account."); return; }
    if (!date) { setError("Date is required."); return; }

    const payload = {
      amount: amt,
      description: description.trim(),
      type,
      date,
      accountId: accountId as number,
      categoryId: categoryId !== "" ? categoryId as number : undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit) {
      updateMut.mutate({ id: transaction!.id, data: payload }, {
        onError: () => setError("Failed to update transaction."),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onError: () => setError("Failed to create transaction."),
      });
    }
  };

  if (!open) return null;

  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--title-text)", marginBottom: "5px", display: "block",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: "4px",
    background: "rgba(0, 0, 0, 0.4)", border: "1px solid var(--panel-border)",
    color: "rgba(255, 255, 255, 0.95)", fontSize: "0.85rem", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{isEdit ? "Edit Transaction" : "Add Transaction"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "13px" }}>

          {/* Expense / Income toggle */}
          <div style={{ display: "flex", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--panel-border)" }}>
            {(["expense", "income"] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(""); }}
                style={{
                  flex: 1, padding: "9px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", border: "none", letterSpacing: "0.05em",
                  background: type === t
                    ? (t === "expense" ? "rgba(239, 68, 68, 0.25)" : "rgba(34, 197, 94, 0.25)")
                    : "rgba(0, 0, 0, 0.45)",
                  color: type === t
                    ? (t === "expense" ? "#f87171" : "#6ee87a")
                    : "rgba(255, 255, 255, 0.45)",
                  transition: "all 0.15s",
                  borderRight: t === "expense" ? "1px solid var(--panel-border)" : "none",
                }}>
                {t === "expense" ? "↓ Expense" : "↑ Income"}
              </button>
            ))}
          </div>

          {/* Amount + Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Amount</label>
              <input style={{ ...inputStyle, fontWeight: 700, fontSize: "1rem", color: type === "expense" ? "#f87171" : "#6ee87a" }}
                type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Grocery run" />
          </div>

          {/* Account + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Account</label>
              <select style={inputStyle} value={accountId} onChange={e => setAccountId(Number(e.target.value))}>
                {!Array.isArray(accounts) || accounts.length === 0
                  ? <option value="">No accounts</option>
                  : accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                }
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">— None —</option>
                {(() => {
                  const parents = filteredCategories.filter(c => !c.parentId);
                  const children = filteredCategories.filter(c => c.parentId);
                  const childrenMap: Record<number, typeof filteredCategories> = {};
                  children.forEach(child => {
                    const pid = child.parentId!;
                    if (!childrenMap[pid]) childrenMap[pid] = [];
                    childrenMap[pid].push(child);
                  });

                  return parents.map(parent => {
                    const subCats = childrenMap[parent.id] || [];
                    if (subCats.length === 0) {
                      return <option key={parent.id} value={parent.id}>{parent.name}</option>;
                    }
                    return (
                      <optgroup key={parent.id} label={parent.name} style={{ background: "var(--bg-color)", color: "#fff" }}>
                        <option value={parent.id}>{parent.name} (Main)</option>
                        {subCats.map(child => (
                          <option key={child.id} value={child.id}>↳ {child.name}</option>
                        ))}
                      </optgroup>
                    );
                  });
                })()}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "56px", fontFamily: "inherit" }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details…" />
          </div>

          {error && (
            <div style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,60,60,0.3)", borderRadius: "4px", padding: "7px 10px", color: "#f87171", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "2px" }}>
            {isEdit && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,30,30,0.15)", border: "1px solid rgba(200,50,50,0.3)", color: "#f87171" }}>
                Delete
              </button>
            )}
            {confirmDelete && (
              <button type="button" onClick={() => deleteMut.mutate({ id: transaction!.id })} disabled={isPending}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "rgba(200,40,40,0.35)", border: "1px solid rgba(220,60,60,0.5)", color: "#fca5a5" }}>
                {isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            )}
            <button type="button" onClick={onClose}
              style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid var(--panel-border)", color: "rgba(255,255,255,0.7)" }}>
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={isPending}
              style={{ padding: "7px 18px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              {isPending ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save Changes" : "Add Transaction")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
      `}</style>
    </div>
  );
}

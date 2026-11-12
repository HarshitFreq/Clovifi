import { useState, useEffect } from "react";
import {
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  getListAccountsQueryKey,
} from "@workspace/api-client-react";
import type { Account } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency";
import { useQueryClient } from "@tanstack/react-query";
import { useSoundEffects } from "@/lib/sound";
import { X } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
] as const;

const PRESET_COLORS = [
  "#4da820", "#66c028", "#3ea8d0", "#d0883e", "#c03e6e",
  "#8c3ec0", "#3e60c0", "#c0bb3e", "#3ec0a4", "#c05a3e",
];

interface Props {
  open: boolean;
  onClose: () => void;
  account?: Account | null; // if set → edit mode
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
  maxWidth: "420px",
  maxHeight: "92dvh",
  overflowY: "auto",
  animation: "slideUp 0.2s ease",
};

export default function AccountModal({ open, onClose, account }: Props) {
  const isEdit = !!account;
  const qc = useQueryClient();
  const { playSuccess, playWarning } = useSoundEffects();

  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [type, setType] = useState<typeof ACCOUNT_TYPES[number]["value"]>("checking");
  const [balance, setBalance] = useState("0");
  const [color, setColor] = useState("#4da820");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(account?.name ?? "");
      setType((account?.type as typeof ACCOUNT_TYPES[number]["value"]) ?? "checking");
      setBalance(account ? String(account.balance) : "0");
      setColor(account?.color ?? "#4da820");
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, account]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAccountsQueryKey() });

  const createMut = useCreateAccount({ mutation: { onSuccess: () => { invalidate(); playSuccess(); onClose(); } } });
  const updateMut = useUpdateAccount({ mutation: { onSuccess: () => { invalidate(); playSuccess(); onClose(); } } });
  const deleteMut = useDeleteAccount({ mutation: { onSuccess: () => { invalidate(); playWarning(); onClose(); } } });

  const isPending = createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(balance);
    if (!name.trim()) { setError("Account name is required."); return; }
    if (isNaN(amt)) { setError("Balance must be a number."); return; }

    const payload = { name: name.trim(), type, balance: amt, currency, color };
    if (isEdit) {
      updateMut.mutate({ id: account!.id, data: payload }, {
        onError: () => setError("Failed to update account."),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onError: () => setError("Failed to create account."),
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
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={OVERLAY} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={MODAL}>
        {/* Title bar */}
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{isEdit ? "Edit Account" : "Add Account"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Account Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Checking" autoFocus />
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select style={{ ...inputStyle }} value={type} onChange={e => setType(e.target.value as typeof type)}>
              {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label style={labelStyle}>Starting Balance</label>
            <input style={inputStyle} type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: "22px", height: "22px", borderRadius: "4px", background: c, border: "none",
                    cursor: "pointer", flexShrink: 0,
                    boxShadow: color === c ? `0 0 0 2px rgba(255,255,255,0.7), 0 0 8px ${c}80` : "none",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: "28px", height: "22px", border: "1px solid var(--panel-border)", borderRadius: "4px", background: "transparent", cursor: "pointer", padding: "0" }} />
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,60,60,0.3)", borderRadius: "4px", padding: "7px 10px", color: "#f87171", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            {isEdit && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,30,30,0.15)", border: "1px solid rgba(200,50,50,0.3)", color: "#f87171", transition: "background 0.15s" }}>
                Delete
              </button>
            )}
            {confirmDelete && (
              <button type="button" onClick={() => deleteMut.mutate({ id: account!.id })} disabled={isPending}
                style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "rgba(200,40,40,0.35)", border: "1px solid rgba(220,60,60,0.5)", color: "#fca5a5" }}>
                {isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            )}
            <button type="button" onClick={onClose}
              style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--panel-border)", color: "rgba(255, 255, 255, 0.7)" }}>
              Cancel
            </button>
            <button type="submit" className="glass-button" disabled={isPending}
              style={{ padding: "7px 18px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
              {isPending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Add Account")}
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

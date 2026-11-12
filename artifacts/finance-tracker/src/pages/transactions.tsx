import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check, X, FileText } from "lucide-react";
import {
  useListTransactions,
  getListTransactionsQueryKey,
  useListAccounts,
  getListAccountsQueryKey,
  useListCategories,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import type { Transaction } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";
import TransactionModal from "@/components/TransactionModal";
import ExportPdfModal from "@/components/ExportPdfModal";
import CategoryGlyph from "@/components/CategoryGlyph";

export default function Transactions() {
  const { formatAmount } = useCurrency();
  const { data: transactions, isLoading } = useListTransactions({}, { query: { queryKey: getListTransactionsQueryKey({}) } });

  // Fetch Accounts and Categories for filters
  const { data: accounts } = useListAccounts({
    query: { queryKey: getListAccountsQueryKey() },
  });
  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [activeCapsule, setActiveCapsule] = useState<string | null>(null);

  // helper to get human readable text for active capsule values
  const getTypeText = () => {
    if (selectedType === "all") return "All Types";
    if (selectedType === "expense") return "Expenses";
    if (selectedType === "income") return "Income";
    return "Types";
  };

  const getAccountText = () => {
    if (selectedAccount === "all") return "All Accounts";
    const found = accounts?.find(a => a.id === Number(selectedAccount));
    return found ? found.name : "Accounts";
  };

  const getCategoryText = () => {
    if (selectedCategory === "all") return "All Categories";
    if (selectedCategory === "uncategorized") return "Uncategorized";
    const found = categories?.find(c => c.id === Number(selectedCategory));
    return found ? found.name : "Categories";
  };

  const getDateText = () => {
    if (datePreset === "all") return "Anytime";
    if (datePreset === "week") return "Past 7 Days";
    if (datePreset === "month") return "This Month";
    if (datePreset === "lastMonth") return "Last Month";
    if (datePreset === "custom") return "Custom Range";
    return "Date";
  };

  const getSortText = () => {
    if (sortBy === "dateDesc") return "Newest First";
    if (sortBy === "dateAsc") return "Oldest First";
    if (sortBy === "amountDesc") return "Highest Amount";
    if (sortBy === "amountAsc") return "Lowest Amount";
    if (sortBy === "descAsc") return "Name A-Z";
    if (sortBy === "descDesc") return "Name Z-A";
    return "Sort By";
  };
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");

  const openAdd = () => { setEditingTransaction(null); setModalOpen(true); };
  const openEdit = (tx: Transaction) => { setEditingTransaction(tx); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  // Filtering Logic
  const filteredTransactions = (transactions || []).filter((t) => {
    // 1. Search text filter
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.description.toLowerCase().includes(q)) {
        return false;
      }
    }

    // 2. Account filter
    if (selectedAccount !== "all") {
      if (t.accountId !== Number(selectedAccount)) {
        return false;
      }
    }

    // 3. Category filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "uncategorized") {
        if (t.categoryId !== null && t.categoryId !== undefined) {
          return false;
        }
      } else if (t.categoryId !== Number(selectedCategory)) {
        return false;
      }
    }

    // 4. Type filter
    if (selectedType !== "all") {
      if (t.type !== selectedType) {
        return false;
      }
    }

    // 5. Date filter
    const txDate = new Date(t.date);
    const now = new Date();
    if (datePreset === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      if (txDate < oneWeekAgo) return false;
    } else if (datePreset === "month") {
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (txDate < startOfThisMonth) return false;
    } else if (datePreset === "lastMonth") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      if (txDate < startOfLastMonth || txDate > endOfLastMonth) return false;
    } else if (datePreset === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }

    return true;
  });

  // Sorting Logic
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "dateDesc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "dateAsc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "amountDesc") {
      return b.amount - a.amount;
    } else if (sortBy === "amountAsc") {
      return a.amount - b.amount;
    } else if (sortBy === "descAsc") {
      return a.description.localeCompare(b.description);
    } else if (sortBy === "descDesc") {
      return b.description.localeCompare(a.description);
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Transactions — All Records</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="glass-button" onClick={() => setExportOpen(true)} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem", background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)", borderColor: "var(--panel-border)", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "4px" }}>
              <FileText size={12} />
              <span>Export PDF</span>
            </button>
            <button className="glass-button" onClick={openAdd} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
              + Add Transaction
            </button>
          </div>
        </div>

        {/* ── Dynamic Glass Capsule Filter Bar ── */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--panel-border)", background: "rgba(0, 0, 0, 0.2)", position: "relative" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
            {/* Glossy Search Input */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  borderRadius: "20px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--panel-border)",
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent-border-color)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--panel-border)"}
              />
              {search && (
                <X 
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                />
              )}
            </div>

            {/* Capsules Row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              {/* Type Capsule */}
              <CapsuleButton 
                label={getTypeText()} 
                active={selectedType !== "all"} 
                isOpen={activeCapsule === "type"} 
                onClick={() => setActiveCapsule(activeCapsule === "type" ? null : "type")} 
              />

              {/* Account Capsule */}
              <CapsuleButton 
                label={getAccountText()} 
                active={selectedAccount !== "all"} 
                isOpen={activeCapsule === "account"} 
                onClick={() => setActiveCapsule(activeCapsule === "account" ? null : "account")} 
              />

              {/* Category Capsule */}
              <CapsuleButton 
                label={getCategoryText()} 
                active={selectedCategory !== "all"} 
                isOpen={activeCapsule === "category"} 
                onClick={() => setActiveCapsule(activeCapsule === "category" ? null : "category")} 
              />

              {/* Date Capsule */}
              <CapsuleButton 
                label={getDateText()} 
                active={datePreset !== "all"} 
                isOpen={activeCapsule === "date"} 
                onClick={() => setActiveCapsule(activeCapsule === "date" ? null : "date")} 
              />

              {/* Sort Capsule */}
              <CapsuleButton 
                label={`Sort: ${getSortText()}`} 
                active={sortBy !== "dateDesc"} 
                isOpen={activeCapsule === "sort"} 
                onClick={() => setActiveCapsule(activeCapsule === "sort" ? null : "sort")} 
              />

              {/* Clear Filters Button (If any active) */}
              {(selectedType !== "all" || selectedAccount !== "all" || selectedCategory !== "all" || datePreset !== "all" || search || sortBy !== "dateDesc") && (
                <button
                  onClick={() => {
                    setSelectedType("all");
                    setSelectedAccount("all");
                    setSelectedCategory("all");
                    setDatePreset("all");
                    setStartDate("");
                    setEndDate("");
                    setSearch("");
                    setSortBy("dateDesc");
                    setActiveCapsule(null);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "15px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#fca5a5",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* AnimatePresence Option Popup Menu */}
          <AnimatePresence>
            {activeCapsule && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                  position: "absolute",
                  left: "16px",
                  right: "16px",
                  top: "100%",
                  zIndex: 100,
                  marginTop: "8px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.65), 0 0 0 1px var(--panel-border)",
                }}
                className="glass-panel"
              >
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--panel-border)", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--title-text)" }}>
                      Filter by {activeCapsule}
                    </span>
                    <span 
                      onClick={() => setActiveCapsule(null)} 
                      style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <X style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.4)" }} />
                    </span>
                  </div>

                  {/* Render Menu Options based on active capsule */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "200px", overflowY: "auto", padding: "4px 0" }}>
                    {activeCapsule === "type" && [
                      { value: "all", label: "All Types" },
                      { value: "expense", label: "Expenses" },
                      { value: "income", label: "Income" }
                    ].map(opt => (
                      <MenuOptionItem 
                        key={opt.value} 
                        label={opt.label} 
                        selected={selectedType === opt.value} 
                        onClick={() => { setSelectedType(opt.value); setActiveCapsule(null); }} 
                      />
                    ))}

                    {activeCapsule === "account" && [
                      { value: "all", label: "All Accounts" },
                      ...(accounts || []).map(a => ({ value: String(a.id), label: a.name }))
                    ].map(opt => (
                      <MenuOptionItem 
                        key={opt.value} 
                        label={opt.label} 
                        selected={selectedAccount === opt.value} 
                        onClick={() => { setSelectedAccount(opt.value); setActiveCapsule(null); }} 
                      />
                    ))}

                    {activeCapsule === "category" && [
                      { value: "all", label: "All Categories" },
                      { value: "uncategorized", label: "Uncategorized" },
                      ...(categories || []).map(c => ({ value: String(c.id), label: c.name }))
                    ].map(opt => (
                      <MenuOptionItem 
                        key={opt.value} 
                        label={opt.label} 
                        selected={selectedCategory === opt.value} 
                        onClick={() => { setSelectedCategory(opt.value); setActiveCapsule(null); }} 
                      />
                    ))}

                    {activeCapsule === "date" && (
                      <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {[
                            { value: "all", label: "Anytime" },
                            { value: "week", label: "Past 7 Days" },
                            { value: "month", label: "This Month" },
                            { value: "lastMonth", label: "Last Month" },
                            { value: "custom", label: "Custom Range..." }
                          ].map(opt => (
                            <MenuOptionItem 
                              key={opt.value} 
                              label={opt.label} 
                              selected={datePreset === opt.value} 
                              onClick={() => { 
                                setDatePreset(opt.value); 
                                if (opt.value !== "custom") {
                                  setActiveCapsule(null); 
                                }
                              }} 
                            />
                          ))}
                        </div>
                        {datePreset === "custom" && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid var(--panel-border)", paddingTop: "8px", flexWrap: "wrap" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)" }}>Start:</span>
                              <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--panel-border)", borderRadius: "4px", color: "#fff", padding: "4px 8px", fontSize: "0.75rem", outline: "none" }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)" }}>End:</span>
                              <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--panel-border)", borderRadius: "4px", color: "#fff", padding: "4px 8px", fontSize: "0.75rem", outline: "none" }}
                              />
                            </div>
                            <button
                              className="glass-button"
                              onClick={() => setActiveCapsule(null)}
                              style={{ padding: "4px 12px", borderRadius: "4px", fontSize: "0.7rem" }}
                            >
                              Apply Range
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {activeCapsule === "sort" && [
                      { value: "dateDesc", label: "Newest First" },
                      { value: "dateAsc", label: "Oldest First" },
                      { value: "amountDesc", label: "Highest Amount" },
                      { value: "amountAsc", label: "Lowest Amount" },
                      { value: "descAsc", label: "Name A-Z" },
                      { value: "descDesc", label: "Name Z-A" }
                    ].map(opt => (
                      <MenuOptionItem 
                        key={opt.value} 
                        label={opt.label} 
                        selected={sortBy === opt.value} 
                        onClick={() => { setSortBy(opt.value); setActiveCapsule(null); }} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading transactions…
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" }}>No transactions yet.</div>
            <button className="glass-button" onClick={openAdd} style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Transaction
            </button>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" }}>No matching transactions found.</div>
            <button
              className="glass-button"
              onClick={() => {
                setSearch("");
                setSelectedAccount("all");
                setSelectedCategory("all");
                setSelectedType("all");
                setDatePreset("all");
                setStartDate("");
                setEndDate("");
                setSortBy("dateDesc");
              }}
              style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((t) => (
                  <tr key={t.id} onClick={() => openEdit(t)} style={{ cursor: "pointer" }}>
                    <td style={{ color: "rgba(255, 255, 255, 0.45)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </td>
                    <td style={{ fontWeight: 500, color: "var(--title-text)" }}>{t.description}</td>
                    <td>
                      {t.categoryName ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: `${t.categoryColor || "#4da820"}30`,
                          color: t.categoryColor || "#66c028",
                          border: `1px solid ${t.categoryColor || "#4da820"}50`,
                          letterSpacing: "0.04em",
                        }}>
                          <CategoryGlyph icon={t.categoryIcon} name={t.categoryName} color={t.categoryColor || "#66c028"} size={11} />
                          <span>{t.categoryName}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.3)", fontStyle: "italic" }}>Uncategorized</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.65)" }}>{t.accountName}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        background: t.type === "income" ? "rgba(50,180,60,0.15)" : "rgba(200,60,60,0.15)",
                        color: t.type === "income" ? "#6ee87a" : "#f87171",
                        border: `1px solid ${t.type === "income" ? "rgba(60,180,70,0.3)" : "rgba(200,60,60,0.3)"}`,
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: t.type === "income" ? "#6ee87a" : "#f87171", textShadow: t.type === "income" ? "0 0 8px rgba(60,200,80,0.4)" : "0 0 8px rgba(220,60,60,0.3)" }}>
                      {t.type === "income" ? "+" : "-"}{formatAmount(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal open={modalOpen} onClose={closeModal} transaction={editingTransaction} />
      <ExportPdfModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}

function CapsuleButton({ label, active, isOpen, onClick }: { label: string; active: boolean; isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: "16px",
        background: active 
          ? "linear-gradient(to bottom, var(--accent-gradient-1) 0%, var(--accent-gradient-2) 45%, var(--accent-gradient-3) 50%, var(--accent-gradient-4) 100%)" 
          : "rgba(255, 255, 255, 0.05)",
        border: active 
          ? "1px solid var(--accent-border-color)" 
          : "1px solid var(--panel-border)",
        color: active ? "#fff" : "rgba(255, 255, 255, 0.8)",
        fontSize: "0.75rem",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: active ? "0 0 8px var(--accent-glow-shadow)" : "none",
        transition: "all 0.15s",
        textShadow: active ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--panel-border)";
          e.currentTarget.style.borderColor = "var(--accent-border-color)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.borderColor = "var(--panel-border)";
        }
      }}
    >
      {active && (
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", display: "inline-block" }} />
      )}
      <span>{label}</span>
      <ChevronDown 
        style={{ 
          width: "12px", 
          height: "12px", 
          transition: "transform 0.2s", 
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          opacity: 0.8 
        }} 
      />
    </button>
  );
}

function MenuOptionItem({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "15px",
        background: selected 
          ? "linear-gradient(to bottom, var(--accent-gradient-1) 0%, var(--accent-gradient-2) 45%, var(--accent-gradient-3) 50%, var(--accent-gradient-4) 100%)" 
          : "rgba(0, 0, 0, 0.35)",
        border: selected 
          ? "1px solid var(--accent-border-color)" 
          : "1px solid var(--panel-border)",
        color: selected ? "#fff" : "rgba(255, 255, 255, 0.8)",
        fontSize: "0.75rem",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "all 0.12s",
        textShadow: selected ? "0 1px 1.5px rgba(0,0,0,0.5)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "var(--panel-border)";
          e.currentTarget.style.borderColor = "var(--accent-border-color)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.35)";
          e.currentTarget.style.borderColor = "var(--panel-border)";
        }
      }}
    >
      {selected && <Check style={{ width: "11px", height: "11px", strokeWidth: 3 }} />}
      <span>{label}</span>
    </button>
  );
}

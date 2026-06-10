import { useState } from "react";
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
            <button className="glass-button" onClick={() => setExportOpen(true)} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem", background: "linear-gradient(to bottom, rgba(50,80,20,0.4) 0%, rgba(20,40,10,0.5) 100%)", borderColor: "rgba(60,120,20,0.3)", color: "rgba(180,230,120,0.85)" }}>
              📄 Export PDF
            </button>
            <button className="glass-button" onClick={openAdd} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
              + Add Transaction
            </button>
          </div>
        </div>

        {/* ── Filters & Search Control Bar ── */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(80, 160, 30, 0.15)", background: "rgba(6, 18, 4, 0.3)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {/* Search Input */}
            <div style={{ flex: "1 1 200px" }}>
              <input
                type="text"
                placeholder="Search descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ flex: "0 1 120px" }}>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="all">All Types</option>
                <option value="expense">📉 Expenses</option>
                <option value="income">📈 Income</option>
              </select>
            </div>

            {/* Account Filter */}
            <div style={{ flex: "0 1 140px" }}>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="all">All Accounts</option>
                {Array.isArray(accounts) && accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ flex: "0 1 140px" }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="all">All Categories</option>
                <option value="uncategorized">Uncategorized</option>
                {(() => {
                  const catsList = Array.isArray(categories) ? categories : [];
                  const parents = catsList.filter(c => !c.parentId);
                  const children = catsList.filter(c => c.parentId);
                  const childrenMap: Record<number, typeof catsList> = {};
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
                      <optgroup key={parent.id} label={parent.name} style={{ background: "rgba(6,18,4,0.98)", color: "rgba(215,240,190,0.95)" }}>
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

            {/* Date Range Preset Selector */}
            <div style={{ flex: "0 1 140px" }}>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="all">Anytime</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div style={{ flex: "0 1 140px" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="dateDesc">Newest First</option>
                <option value="dateAsc">Oldest First</option>
                <option value="amountDesc">Highest Amount</option>
                <option value="amountAsc">Lowest Amount</option>
                <option value="descAsc">Name A-Z</option>
                <option value="descDesc">Name Z-A</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Selectors */}
          {datePreset === "custom" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", animation: "fadeIn 0.15s ease" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(160,220,90,0.7)" }}>From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(160,220,90,0.7)" }}>To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "4px",
                  background: "rgba(8, 22, 4, 0.75)",
                  border: "1px solid rgba(70, 140, 25, 0.35)",
                  color: "rgba(215, 240, 190, 0.95)",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(130,180,80,0.55)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading transactions…
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.9rem" }}>No transactions yet.</div>
            <button className="glass-button" onClick={openAdd} style={{ padding: "6px 16px", borderRadius: "4px", fontSize: "0.8rem" }}>
              + Add First Transaction
            </button>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.9rem" }}>No matching transactions found.</div>
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
                    <td style={{ color: "rgba(160,210,100,0.75)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </td>
                    <td style={{ fontWeight: 500, color: "rgba(215,240,190,0.9)" }}>{t.description}</td>
                    <td>
                      {t.categoryName ? (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "3px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: `${t.categoryColor || "#4da820"}30`,
                          color: t.categoryColor || "#66c028",
                          border: `1px solid ${t.categoryColor || "#4da820"}50`,
                          letterSpacing: "0.04em",
                        }}>
                          {t.categoryName}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "rgba(100,140,60,0.45)", fontStyle: "italic" }}>Uncategorized</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "rgba(150,200,100,0.7)" }}>{t.accountName}</td>
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

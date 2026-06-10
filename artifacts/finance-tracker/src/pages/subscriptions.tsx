import { useState, useEffect } from "react";
import {
  useListSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  usePaySubscription,
  useListAccounts,
  useListCategories,
  getListSubscriptionsQueryKey,
  getListAccountsQueryKey,
  getListCategoriesQueryKey,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import type { Subscription } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";
import { useCurrency } from "@/lib/currency";
import { useSoundEffects } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Subscriptions() {
  const qc = useQueryClient();
  const { formatAmount } = useCurrency();
  const { playSuccess, playWarning } = useSoundEffects();
  const { toast } = useToast();

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal / Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [interval, setInterval] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [accountId, setAccountId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // API Queries
  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions({
    query: { queryKey: getListSubscriptionsQueryKey() },
  });
  const { data: accounts } = useListAccounts({
    query: { queryKey: getListAccountsQueryKey() },
  });
  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const filteredCategories = Array.isArray(categories)
    ? categories.filter((c) => c.type === type || c.type === "both")
    : [];

  // Invalidate cache helper
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
    qc.invalidateQueries({ queryKey: getListTransactionsQueryKey({}) });
    qc.invalidateQueries({ queryKey: getListAccountsQueryKey() });
    qc.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith?.("/api/summary") });
  };

  // API Mutations
  const createMut = useCreateSubscription({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        playSuccess();
        setModalOpen(false);
        toast({ title: "Subscription added", description: `Successfully created recurring ${name}.` });
      },
    },
  });

  const updateMut = useUpdateSubscription({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        playSuccess();
        setModalOpen(false);
        toast({ title: "Subscription updated", description: `Successfully updated recurring ${name}.` });
      },
    },
  });

  const deleteMut = useDeleteSubscription({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        playWarning();
        setConfirmDeleteId(null);
        toast({ title: "Subscription deleted", description: "The recurring bill has been removed." });
      },
    },
  });

  const payMut = usePaySubscription({
    mutation: {
      onSuccess: (updatedSub) => {
        invalidateAll();
        playSuccess();
        toast({
          title: "Payment Logged! 🍀",
          description: `Logged transaction for ${updatedSub.name}. Next due date advanced to ${format(
            new Date(updatedSub.nextDueDate),
            "MMM d, yyyy"
          )}.`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Payment Failed",
          description: err?.message || "An error occurred while logging payment.",
          variant: "destructive",
        });
      },
    },
  });

  // Prefill fields when editing
  useEffect(() => {
    if (modalOpen) {
      if (editingSub) {
        setName(editingSub.name);
        setAmount(String(editingSub.amount));
        setType((editingSub.type as "expense" | "income") ?? "expense");
        setInterval((editingSub.interval as "monthly" | "weekly" | "yearly") ?? "monthly");
        setNextDueDate(editingSub.nextDueDate);
        setAccountId(editingSub.accountId);
        setCategoryId(editingSub.categoryId ?? "");
        setNotes(editingSub.notes ?? "");
        setIsActive(editingSub.isActive);
      } else {
        setName("");
        setAmount("");
        setType("expense");
        setInterval("monthly");
        setNextDueDate(format(new Date(), "yyyy-MM-dd"));
        setAccountId(Array.isArray(accounts) && accounts.length > 0 ? accounts[0].id : "");
        setCategoryId("");
        setNotes("");
        setIsActive(true);
      }
      setFormError(null);
    }
  }, [modalOpen, editingSub]);

  // Set default account when loaded
  useEffect(() => {
    if (!editingSub && Array.isArray(accounts) && accounts.length > 0 && accountId === "") {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(amount);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }
    if (accountId === "") {
      setFormError("Please select an account.");
      return;
    }
    if (!nextDueDate) {
      setFormError("Next due date is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      amount: amt,
      type,
      interval,
      nextDueDate,
      accountId: accountId as number,
      categoryId: categoryId !== "" ? (categoryId as number) : undefined,
      notes: notes.trim() || undefined,
      isActive,
    };

    if (editingSub) {
      updateMut.mutate({ id: editingSub.id, data: payload }, {
        onError: () => setFormError("Failed to update subscription."),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onError: () => setFormError("Failed to create subscription."),
      });
    }
  };

  // Calendar Day Projection Math
  function isSubDueOnDay(sub: Subscription, day: Date): boolean {
    if (!sub.isActive) return false;
    // nextDueDate is YYYY-MM-DD
    const parts = sub.nextDueDate.split("-").map(Number);
    const due = new Date(parts[0], parts[1] - 1, parts[2]);

    const formattedDue = format(due, "yyyy-MM-dd");
    const formattedDay = format(day, "yyyy-MM-dd");

    if (formattedDue === formattedDay) {
      return true;
    }

    // Subscriptions cannot fall in dates prior to nextDueDate
    if (day < due) {
      return false;
    }

    if (sub.interval === "weekly") {
      return day.getDay() === due.getDay();
    } else if (sub.interval === "yearly") {
      return day.getMonth() === due.getMonth() && day.getDate() === due.getDate();
    } else {
      // Monthly recurrence
      const dueDay = due.getDate();
      const lastDayOfTargetMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
      if (dueDay > lastDayOfTargetMonth) {
        return day.getDate() === lastDayOfTargetMonth;
      }
      return day.getDate() === dueDay;
    }
  }

  // Monthly Calendar Generation
  const startOfCalendarMonth = startOfMonth(currentMonth);
  const endOfCalendarMonth = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: startOfCalendarMonth, end: endOfCalendarMonth });
  const startDayOfWeek = startOfCalendarMonth.getDay(); // 0 = Sunday, 1 = Monday etc
  const paddingBoxes = Array.from({ length: startDayOfWeek });

  // Outflow Forecasting
  let activeCommitment = 0;
  let activeSubsCount = 0;
  let forecastedOutflow = 0;

  if (Array.isArray(subscriptions)) {
    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;
      activeSubsCount++;
      
      // Annual calculation
      let annualFactor = 12; // default monthly
      if (sub.interval === "weekly") annualFactor = 52;
      else if (sub.interval === "yearly") annualFactor = 1;
      
      activeCommitment += sub.amount * (annualFactor / 12);

      // Monthly forecast: sum occurrences in the calendar view
      let monthlyOccurrences = 0;
      calendarDays.forEach((day) => {
        if (isSubDueOnDay(sub, day)) {
          monthlyOccurrences++;
        }
      });
      forecastedOutflow += monthlyOccurrences * sub.amount;
    });
  }

  const openAdd = () => {
    setEditingSub(null);
    setModalOpen(true);
  };

  const openEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setModalOpen(true);
  };

  const handlePay = (subId: number) => {
    payMut.mutate({ id: subId });
  };

  const handleDelete = (subId: number) => {
    deleteMut.mutate({ id: subId });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Heading Panel ── */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Subscriptions & Recurring Commitments</span>
          <button className="glass-button" onClick={openAdd} style={{ padding: "3px 12px", borderRadius: "4px", fontSize: "0.72rem" }}>
            <Plus style={{ width: 12, height: 12, display: "inline", marginRight: 4, verticalAlign: "text-bottom" }} /> Add Subscription
          </button>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <p style={{ color: "rgba(190,225,150,0.75)", fontSize: "0.8rem", margin: 0 }}>
            Configure and track your automated billing schedules. Click on any date on the calendar to manage due bills and record transactions.
          </p>
        </div>
      </div>

      {/* Outflow Forecast Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(150,220,90,0.6)" }}>
              Outflow ({format(currentMonth, "MMM yyyy")})
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                style={{ background: "none", border: "none", color: "rgba(150,220,90,0.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              >
                <ChevronLeft style={{ width: 12, height: 12 }} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                style={{ background: "none", border: "none", color: "rgba(150,220,90,0.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              >
                <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", marginTop: "4px", fontFamily: "monospace" }}>
            {formatAmount(forecastedOutflow)}
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(150,220,90,0.6)" }}>
            Monthly Commitment
          </span>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", marginTop: "4px", fontFamily: "monospace" }}>
            {formatAmount(activeCommitment)}
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(150,220,90,0.6)" }}>
            Active Schedules
          </span>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", marginTop: "4px", fontFamily: "monospace" }}>
            {activeSubsCount}
          </div>
        </div>
      </div>

      {/* Subscriptions List Manager Panel */}
      <div className="glass-panel" style={{ borderRadius: "6px", overflow: "hidden" }}>
        <div className="panel-titlebar">All Recurring Schedules</div>
        {subsLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(130,180,80,0.55)", fontSize: "0.85rem", fontStyle: "italic" }}>
            Loading schedules…
          </div>
        ) : !Array.isArray(subscriptions) || subscriptions.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ color: "rgba(130,180,80,0.55)", fontSize: "0.85rem" }}>No recurring schedules configured yet.</div>
            <button className="glass-button" onClick={openAdd} style={{ padding: "5px 14px", borderRadius: "4px", fontSize: "0.76rem" }}>
              + Add First Schedule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aero-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Amount/Freq</th>
                  <th>Next Bill Date</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const catColor = sub.categoryColor || "#66c028";
                  const isPendingPay = payMut.isPending && payMut.variables?.id === sub.id;

                  return (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>{sub.name}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: sub.type === "income" ? "#6ee87a" : "#f87171" }}>
                          {sub.type === "income" ? "+" : "-"}{formatAmount(sub.amount)}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: "rgba(150,200,100,0.5)", textTransform: "uppercase", marginLeft: 6 }}>
                          / {sub.interval.substring(0, 3)}
                        </span>
                      </td>
                      <td style={{ color: "rgba(160,210,100,0.85)", fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {format(new Date(sub.nextDueDate), "MMM d, yyyy")}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "rgba(150,200,100,0.7)" }}>{sub.accountName}</td>
                      <td>
                        {sub.categoryName ? (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              background: `${catColor}22`,
                              color: catColor,
                              border: `1px solid ${catColor}40`,
                            }}
                          >
                            {sub.categoryName}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "rgba(100,140,60,0.4)", fontStyle: "italic" }}>
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setName(sub.name);
                            updateMut.mutate({ id: sub.id, data: { isActive: !sub.isActive } });
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: "3px",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              background: sub.isActive ? "rgba(50,180,60,0.12)" : "rgba(200,200,200,0.06)",
                              color: sub.isActive ? "#6ee87a" : "rgba(200,200,200,0.35)",
                              border: `1px solid ${sub.isActive ? "rgba(60,180,70,0.25)" : "rgba(200,200,200,0.15)"}`,
                            }}
                          >
                            {sub.isActive ? "Active" : "Paused"}
                          </span>
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {sub.isActive && (
                            <button
                              className="glass-button"
                              onClick={() => handlePay(sub.id)}
                              disabled={isPendingPay}
                              style={{ padding: "2px 8px", borderRadius: "3px", fontSize: "0.65rem", fontWeight: 700 }}
                            >
                              {isPendingPay ? "Paying…" : "Pay"}
                            </button>
                          )}
                          <button
                            className="glass-button"
                            onClick={() => openEdit(sub)}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: "linear-gradient(to bottom, rgba(50,80,20,0.3) 0%, rgba(20,40,10,0.4) 100%)",
                              borderColor: "rgba(60,120,20,0.22)",
                              color: "rgba(180,230,120,0.8)",
                            }}
                          >
                            <Edit style={{ width: 10, height: 10 }} />
                          </button>
                          {confirmDeleteId === sub.id ? (
                            <button
                              className="glass-button"
                              onClick={() => handleDelete(sub.id)}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "3px",
                                background: "linear-gradient(to bottom, #dc2626 0%, #991b1b 100%)",
                                borderColor: "#ef4444",
                                color: "#fff",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                              }}
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              className="glass-button"
                              onClick={() => setConfirmDeleteId(sub.id)}
                              style={{
                                padding: "2px 6px",
                                borderRadius: "3px",
                                background: "linear-gradient(to bottom, rgba(200,60,60,0.1) 0%, rgba(150,40,40,0.15) 100%)",
                                borderColor: "rgba(200,60,60,0.25)",
                                color: "rgba(240,180,180,0.75)",
                              }}
                            >
                              <Trash2 style={{ width: 10, height: 10 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add/Edit Subscription Modal ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", animation: "fadeIn 0.15s ease" }}
             onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={{ background: "rgba(6,18,4,0.96)", border: "1px solid rgba(80,160,30,0.35)", boxShadow: "0 24px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(140,220,60,0.1)", borderRadius: "8px", width: "100%", maxWidth: "460px", overflow: "hidden", animation: "slideUp 0.2s ease" }}>
            
            {/* Title Bar */}
            <div className="panel-titlebar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{editingSub ? "Edit Subscription" : "Add Subscription"}</span>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(180,220,120,0.6)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Type Switcher */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={type === "expense" ? "nav-active" : "currency-btn"}
                  style={{ padding: "6px", borderRadius: "4px", fontSize: "0.76rem", fontWeight: 700, border: "1px solid transparent" }}
                >
                  📉 Recurring Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={type === "income" ? "nav-active" : "currency-btn"}
                  style={{ padding: "6px", borderRadius: "4px", fontSize: "0.76rem", fontWeight: 700, border: "1px solid transparent" }}
                >
                  📈 Recurring Income
                </button>
              </div>

              {/* Name & Amount */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Name</label>
                  <input
                    placeholder="e.g. Netflix, Rent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Frequency & Next Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Frequency</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as any)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Next Due Date</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Account & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  >
                    {Array.isArray(accounts) &&
                      accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value !== "" ? Number(e.target.value) : "")}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Uncategorized</option>
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
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(160,220,90,0.75)", marginBottom: "5px", display: "block" }}>Notes</label>
                <textarea
                  placeholder="Optional details..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", background: "rgba(8,22,4,0.75)", border: "1px solid rgba(70,140,25,0.35)", color: "rgba(215,240,190,0.95)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", resize: "none" }}
                />
              </div>

              {/* Active Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="isActive" style={{ fontSize: "0.76rem", fontWeight: 600, color: "rgba(215,240,190,0.9)", cursor: "pointer" }}>
                  Active Scheduling (Disabled updates pauses occurrences)
                </label>
              </div>

              {/* Error messages */}
              {formError && (
                <div style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,60,60,0.3)", borderRadius: "4px", padding: "7px 10px", color: "#f87171", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "7px 14px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(20,50,8,0.6)", border: "1px solid rgba(60,120,20,0.3)", color: "rgba(180,220,130,0.8)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button"
                  disabled={createMut.isPending || updateMut.isPending}
                  style={{ padding: "7px 18px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, minWidth: "100px" }}
                >
                  {createMut.isPending || updateMut.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled bubble chimes & transitions */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

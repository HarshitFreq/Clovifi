/**
 * Client-Side Local Ledger Storage Engine
 * 
 * Provides an offline-first, client-side data store in localStorage when running on
 * static hosting (e.g. Firebase Hosting) or when the backend server is unreachable.
 * Mirrors the exact endpoints, calculations, and data models of the PostgreSQL backend.
 */

export interface LocalAccount {
  id: number;
  userId: number;
  name: string;
  type: "checking" | "savings" | "credit_card" | "investment" | "loan";
  balance: string;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCategory {
  id: number;
  userId: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  parentId: number | null;
  budgetLimit: string | null;
}

export interface LocalTransaction {
  id: number;
  userId: number;
  accountId: number;
  categoryId: number | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  currency: string;
  date: string;
  description: string;
  payee?: string | null;
  notes?: string | null;
  accountName?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  createdAt: string;
}

export interface LocalSubscription {
  id: number;
  userId: number;
  accountId: number;
  categoryId: number | null;
  name: string;
  amount: number;
  interval: "weekly" | "monthly" | "yearly";
  nextDueDate: string;
  isActive: boolean;
  type: "expense" | "income";
  accountName?: string;
  categoryName?: string;
  notes?: string | null;
}

const STORAGE_KEYS = {
  ACCOUNTS: "clovifi_local_accounts_v2",
  CATEGORIES: "clovifi_local_categories_v2",
  TRANSACTIONS: "clovifi_local_transactions_v2",
  SUBSCRIPTIONS: "clovifi_local_subscriptions_v2",
  USER: "clovifi_local_user_v2",
  INITIALIZED: "clovifi_local_initialized_v2",
};

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// Default sample categories
const DEFAULT_CATEGORIES: LocalCategory[] = [
  { id: 1, userId: 1, name: "Salary", type: "income", color: "#22c55e", icon: "wallet", parentId: null, budgetLimit: null },
  { id: 2, userId: 1, name: "Freelance", type: "income", color: "#10b981", icon: "briefcase", parentId: null, budgetLimit: null },
  { id: 3, userId: 1, name: "Investments", type: "income", color: "#06b6d4", icon: "trending-up", parentId: null, budgetLimit: null },
  { id: 4, userId: 1, name: "Food & Dining", type: "expense", color: "#f97316", icon: "utensils", parentId: null, budgetLimit: "12000" },
  { id: 5, userId: 1, name: "Groceries", type: "expense", color: "#65a30d", icon: "cart", parentId: null, budgetLimit: "15000" },
  { id: 6, userId: 1, name: "Housing & Rent", type: "expense", color: "#8b5cf6", icon: "home", parentId: null, budgetLimit: "25000" },
  { id: 7, userId: 1, name: "Transport", type: "expense", color: "#3b82f6", icon: "car", parentId: null, budgetLimit: "6000" },
  { id: 8, userId: 1, name: "Utilities", type: "expense", color: "#14b8a6", icon: "zap", parentId: null, budgetLimit: "4500" },
  { id: 9, userId: 1, name: "Entertainment", type: "expense", color: "#f43f5e", icon: "film", parentId: null, budgetLimit: "5000" },
  { id: 10, userId: 1, name: "Healthcare", type: "expense", color: "#ef4444", icon: "activity", parentId: null, budgetLimit: "3000" },
];

// Default sample accounts
const DEFAULT_ACCOUNTS: LocalAccount[] = [
  {
    id: 1,
    userId: 1,
    name: "Main Checking",
    type: "checking",
    balance: "45000.00",
    currency: "INR",
    color: "#22c55e",
    icon: "landmark",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    name: "High-Yield Savings",
    type: "savings",
    balance: "120000.00",
    currency: "INR",
    color: "#3b82f6",
    icon: "piggy-bank",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    name: "Credit Card",
    type: "credit_card",
    balance: "-6500.00",
    currency: "INR",
    color: "#f43f5e",
    icon: "credit-card",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Generate 16 realistic demo transactions
function generateDefaultTransactions(): LocalTransaction[] {
  return [
    { id: 1, userId: 1, accountId: 1, categoryId: 1, amount: 85000, currency: "INR", type: "income", date: `${daysAgo(2)}T10:00:00.000Z`, description: "Monthly Salary Deposit", payee: "Employer Corp", notes: "Direct payroll transfer", accountName: "Main Checking", categoryName: "Salary", categoryColor: "#22c55e", categoryIcon: "wallet", createdAt: new Date().toISOString() },
    { id: 2, userId: 1, accountId: 1, categoryId: 6, amount: 22000, currency: "INR", type: "expense", date: `${daysAgo(3)}T11:30:00.000Z`, description: "Apartment Rent", payee: "Skyline Properties", notes: "Monthly lease", accountName: "Main Checking", categoryName: "Housing & Rent", categoryColor: "#8b5cf6", categoryIcon: "home", createdAt: new Date().toISOString() },
    { id: 3, userId: 1, accountId: 3, categoryId: 5, amount: 3450, currency: "INR", type: "expense", date: `${daysAgo(4)}T14:15:00.000Z`, description: "Supermarket Groceries", payee: "Nature's Basket", notes: "Weekly pantry essentials", accountName: "Credit Card", categoryName: "Groceries", categoryColor: "#65a30d", categoryIcon: "cart", createdAt: new Date().toISOString() },
    { id: 4, userId: 1, accountId: 3, categoryId: 4, amount: 1680, currency: "INR", type: "expense", date: `${daysAgo(6)}T20:45:00.000Z`, description: "Restaurant Dining", payee: "The Bistro Grill", notes: "Weekend dinner with friends", accountName: "Credit Card", categoryName: "Food & Dining", categoryColor: "#f97316", categoryIcon: "utensils", createdAt: new Date().toISOString() },
    { id: 5, userId: 1, accountId: 3, categoryId: 7, amount: 2200, currency: "INR", type: "expense", date: `${daysAgo(8)}T09:10:00.000Z`, description: "Fuel & Gas Station", payee: "Highway Petroleum", notes: "Full tank fill", accountName: "Credit Card", categoryName: "Transport", categoryColor: "#3b82f6", categoryIcon: "car", createdAt: new Date().toISOString() },
    { id: 6, userId: 1, accountId: 2, categoryId: 2, amount: 18000, currency: "INR", type: "income", date: `${daysAgo(10)}T16:00:00.000Z`, description: "Freelance Project Milestone", payee: "Design Studio Inc", notes: "UI/UX consulting milestone 2", accountName: "High-Yield Savings", categoryName: "Freelance", categoryColor: "#10b981", categoryIcon: "briefcase", createdAt: new Date().toISOString() },
    { id: 7, userId: 1, accountId: 1, categoryId: 8, amount: 1850, currency: "INR", type: "expense", date: `${daysAgo(12)}T11:00:00.000Z`, description: "Electricity & Power Bill", payee: "City Power Grid", notes: "Monthly utility invoice", accountName: "Main Checking", categoryName: "Utilities", categoryColor: "#14b8a6", categoryIcon: "zap", createdAt: new Date().toISOString() },
    { id: 8, userId: 1, accountId: 3, categoryId: 10, amount: 620, currency: "INR", type: "expense", date: `${daysAgo(15)}T15:20:00.000Z`, description: "Pharmacy & Medicines", payee: "Apollo Care", notes: "Vitamin supplements", accountName: "Credit Card", categoryName: "Healthcare", categoryColor: "#ef4444", categoryIcon: "activity", createdAt: new Date().toISOString() },
    { id: 9, userId: 1, accountId: 3, categoryId: 4, amount: 380, currency: "INR", type: "expense", date: `${daysAgo(17)}T08:30:00.000Z`, description: "Artisan Coffee & Bakery", payee: "Blue Tokai", notes: "Morning espresso", accountName: "Credit Card", categoryName: "Food & Dining", categoryColor: "#f97316", categoryIcon: "utensils", createdAt: new Date().toISOString() },
    { id: 10, userId: 1, accountId: 3, categoryId: 9, amount: 750, currency: "INR", type: "expense", date: `${daysAgo(20)}T19:00:00.000Z`, description: "Cinema Movie Tickets", payee: "PVR Cinemas", notes: "Weekend premiere", accountName: "Credit Card", categoryName: "Entertainment", categoryColor: "#f43f5e", categoryIcon: "film", createdAt: new Date().toISOString() },
    { id: 11, userId: 1, accountId: 1, categoryId: 1, amount: 85000, currency: "INR", type: "income", date: `${daysAgo(32)}T10:00:00.000Z`, description: "Previous Salary Deposit", payee: "Employer Corp", notes: "Direct payroll transfer", accountName: "Main Checking", categoryName: "Salary", categoryColor: "#22c55e", categoryIcon: "wallet", createdAt: new Date().toISOString() },
    { id: 12, userId: 1, accountId: 1, categoryId: 6, amount: 22000, currency: "INR", type: "expense", date: `${daysAgo(33)}T11:30:00.000Z`, description: "Apartment Rent", payee: "Skyline Properties", notes: "Monthly lease", accountName: "Main Checking", categoryName: "Housing & Rent", categoryColor: "#8b5cf6", categoryIcon: "home", createdAt: new Date().toISOString() },
    { id: 13, userId: 1, accountId: 1, categoryId: 5, amount: 4200, currency: "INR", type: "expense", date: `${daysAgo(35)}T16:45:00.000Z`, description: "Groceries Monthly Restock", payee: "Supermart", notes: "Pantry restock", accountName: "Main Checking", categoryName: "Groceries", categoryColor: "#65a30d", categoryIcon: "cart", createdAt: new Date().toISOString() },
    { id: 14, userId: 1, accountId: 2, categoryId: 3, amount: 3200, currency: "INR", type: "income", date: `${daysAgo(38)}T13:00:00.000Z`, description: "Stock Portfolio Dividend", payee: "Nifty 50 Index Fund", notes: "Quarterly yield", accountName: "High-Yield Savings", categoryName: "Investments", categoryColor: "#06b6d4", categoryIcon: "trending-up", createdAt: new Date().toISOString() },
    { id: 15, userId: 1, accountId: 3, categoryId: 4, amount: 2100, currency: "INR", type: "expense", date: `${daysAgo(40)}T21:00:00.000Z`, description: "Dinner with Colleagues", payee: "Trattoria Pasta", notes: "Team celebration", accountName: "Credit Card", categoryName: "Food & Dining", categoryColor: "#f97316", categoryIcon: "utensils", createdAt: new Date().toISOString() },
    { id: 16, userId: 1, accountId: 1, categoryId: 7, amount: 3500, currency: "INR", type: "expense", date: `${daysAgo(42)}T10:15:00.000Z`, description: "Car Maintenance & Service", payee: "AutoCare Service", notes: "Periodic vehicle inspection", accountName: "Main Checking", categoryName: "Transport", categoryColor: "#3b82f6", categoryIcon: "car", createdAt: new Date().toISOString() },
  ];
}

// Generate default subscriptions
function generateDefaultSubscriptions(): LocalSubscription[] {
  return [
    {
      id: 1,
      userId: 1,
      name: "Fiber Internet",
      amount: 1199,
      type: "expense",
      interval: "monthly",
      nextDueDate: daysFromNow(3),
      accountId: 1,
      categoryId: 8,
      isActive: true,
      accountName: "Main Checking",
      categoryName: "Utilities",
      notes: "High-speed broadband",
    },
    {
      id: 2,
      userId: 1,
      name: "Netflix Streaming",
      amount: 649,
      type: "expense",
      interval: "monthly",
      nextDueDate: daysFromNow(7),
      accountId: 3,
      categoryId: 9,
      isActive: true,
      accountName: "Credit Card",
      categoryName: "Entertainment",
      notes: "4K Family Plan",
    },
    {
      id: 3,
      userId: 1,
      name: "Electricity Utility",
      amount: 2200,
      type: "expense",
      interval: "monthly",
      nextDueDate: daysFromNow(12),
      accountId: 1,
      categoryId: 8,
      isActive: true,
      accountName: "Main Checking",
      categoryName: "Utilities",
      notes: "Power grid bill",
    },
  ];
}

class LocalLedgerEngine {
  constructor() {
    this.ensureInitialized();
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("Local ledger storage write failed:", err);
    }
  }

  public ensureInitialized(): void {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.seedDemoData();
    }
  }

  public seedDemoData(): { accounts: number; categories: number; transactions: number; subscriptions: number } {
    const accounts = DEFAULT_ACCOUNTS;
    const categories = DEFAULT_CATEGORIES;
    const transactions = generateDefaultTransactions();
    const subscriptions = generateDefaultSubscriptions();

    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    }

    return {
      accounts: accounts.length,
      categories: categories.length,
      transactions: transactions.length,
      subscriptions: subscriptions.length,
    };
  }

  public clearAll(): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, []);
    this.setItem(STORAGE_KEYS.ACCOUNTS, []);
    this.setItem(STORAGE_KEYS.CATEGORIES, []);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    }
  }

  // ── Accounts ─────────────────────────────────────────────────────────────
  public getAccounts(): LocalAccount[] {
    return this.getItem<LocalAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  }

  public createAccount(data: Partial<LocalAccount>): LocalAccount {
    const list = this.getAccounts();
    const newId = list.length > 0 ? Math.max(...list.map((a) => a.id)) + 1 : 1;
    const acc: LocalAccount = {
      id: newId,
      userId: 1,
      name: data.name || "New Account",
      type: data.type || "checking",
      balance: data.balance?.toString() || "0.00",
      currency: data.currency || "INR",
      color: data.color || "#22c55e",
      icon: data.icon || "landmark",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(acc);
    this.setItem(STORAGE_KEYS.ACCOUNTS, list);
    return acc;
  }

  public updateAccount(id: number, data: Partial<LocalAccount>): LocalAccount | null {
    const list = this.getAccounts();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.ACCOUNTS, list);
    return list[idx];
  }

  public deleteAccount(id: number): boolean {
    let list = this.getAccounts();
    const initialLen = list.length;
    list = list.filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.ACCOUNTS, list);
    return list.length !== initialLen;
  }

  // ── Categories ───────────────────────────────────────────────────────────
  public getCategories(): LocalCategory[] {
    return this.getItem<LocalCategory[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  public createCategory(data: Partial<LocalCategory>): LocalCategory {
    const list = this.getCategories();
    const newId = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1;
    const cat: LocalCategory = {
      id: newId,
      userId: 1,
      name: data.name || "New Category",
      type: data.type || "expense",
      color: data.color || "#3b82f6",
      icon: data.icon || "tag",
      parentId: data.parentId || null,
      budgetLimit: data.budgetLimit?.toString() || null,
    };
    list.push(cat);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    return cat;
  }

  public deleteCategory(id: number): boolean {
    let list = this.getCategories();
    const initialLen = list.length;
    list = list.filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    return list.length !== initialLen;
  }

  // ── Transactions ─────────────────────────────────────────────────────────
  public getTransactions(params?: { startDate?: string; endDate?: string; type?: string; limit?: number }): LocalTransaction[] {
    let list = this.getItem<LocalTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

    if (params?.type) {
      list = list.filter((t) => t.type === params.type);
    }
    if (params?.startDate) {
      list = list.filter((t) => t.date >= params.startDate!);
    }
    if (params?.endDate) {
      list = list.filter((t) => t.date <= params.endDate!);
    }

    // Sort by date desc
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (params?.limit && params.limit > 0) {
      list = list.slice(0, params.limit);
    }
    return list;
  }

  public createTransaction(data: any): LocalTransaction {
    const list = this.getItem<LocalTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const newId = list.length > 0 ? Math.max(...list.map((t) => t.id)) + 1 : 1;
    const accounts = this.getAccounts();
    const categories = this.getCategories();

    const acc = accounts.find((a) => a.id === Number(data.accountId));
    const cat = categories.find((c) => c.id === Number(data.categoryId));
    const numAmount = parseFloat(data.amount) || 0;

    const tx: LocalTransaction = {
      id: newId,
      userId: 1,
      accountId: Number(data.accountId) || 1,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      type: data.type || "expense",
      amount: numAmount,
      currency: data.currency || "INR",
      date: data.date ? (data.date.includes("T") ? data.date : `${data.date}T12:00:00.000Z`) : new Date().toISOString(),
      description: data.description || "Transaction",
      payee: data.payee || null,
      notes: data.notes || null,
      accountName: acc?.name || "Account",
      categoryName: cat?.name || "General",
      categoryColor: cat?.color || "#3b82f6",
      categoryIcon: cat?.icon || "tag",
      createdAt: new Date().toISOString(),
    };

    list.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, list);

    // Update account balance
    if (acc) {
      const currentBal = parseFloat(acc.balance) || 0;
      const newBal = tx.type === "income" ? currentBal + numAmount : currentBal - numAmount;
      this.updateAccount(acc.id, { balance: newBal.toFixed(2) });
    }

    return tx;
  }

  public deleteTransaction(id: number): boolean {
    let list = this.getItem<LocalTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const tx = list.find((t) => t.id === id);
    if (!tx) return false;

    list = list.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, list);

    // Revert account balance
    const accounts = this.getAccounts();
    const acc = accounts.find((a) => a.id === tx.accountId);
    if (acc) {
      const currentBal = parseFloat(acc.balance) || 0;
      const newBal = tx.type === "income" ? currentBal - tx.amount : currentBal + tx.amount;
      this.updateAccount(acc.id, { balance: newBal.toFixed(2) });
    }

    return true;
  }

  // ── Subscriptions ────────────────────────────────────────────────────────
  public getSubscriptions(): LocalSubscription[] {
    return this.getItem<LocalSubscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
  }

  public createSubscription(data: any): LocalSubscription {
    const list = this.getSubscriptions();
    const newId = list.length > 0 ? Math.max(...list.map((s) => s.id)) + 1 : 1;
    const acc = this.getAccounts().find((a) => a.id === Number(data.accountId));
    const cat = this.getCategories().find((c) => c.id === Number(data.categoryId));

    const sub: LocalSubscription = {
      id: newId,
      userId: 1,
      name: data.name || "Subscription",
      amount: parseFloat(data.amount) || 0,
      interval: data.interval || "monthly",
      nextDueDate: data.nextDueDate || daysFromNow(30),
      accountId: Number(data.accountId) || 1,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      type: data.type || "expense",
      accountName: acc?.name || "Account",
      categoryName: cat?.name || "Utility",
      notes: data.notes || null,
    };
    list.push(sub);
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    return sub;
  }

  public deleteSubscription(id: number): boolean {
    let list = this.getSubscriptions();
    const initialLen = list.length;
    list = list.filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    return list.length !== initialLen;
  }

  public paySubscription(id: number): LocalSubscription | null {
    const list = this.getSubscriptions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const sub = list[idx];
    // Record payment as transaction
    this.createTransaction({
      accountId: sub.accountId,
      categoryId: sub.categoryId,
      amount: sub.amount,
      type: sub.type,
      description: `Payment for ${sub.name}`,
      date: new Date().toISOString(),
    });

    // Advance next date
    const d = new Date(sub.nextDueDate);
    if (sub.interval === "weekly") d.setDate(d.getDate() + 7);
    else if (sub.interval === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);

    sub.nextDueDate = d.toISOString().split("T")[0];
    list[idx] = sub;
    this.setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    return sub;
  }

  // ── Metrics & Summaries ──────────────────────────────────────────────────
  public getSummaryOverview(): any {
    const accounts = this.getAccounts();
    const transactions = this.getTransactions();

    const assets = accounts
      .filter((a) => a.type !== "credit_card")
      .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
    const debts = accounts
      .filter((a) => a.type === "credit_card")
      .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance) || 0), 0);
    const totalBalance = assets - debts;

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // "YYYY-MM"
    const thisMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

    const totalIncomeThisMonth = thisMonthTxs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpensesThisMonth = thisMonthTxs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Top category
    const catMap: Record<string, number> = {};
    for (const t of thisMonthTxs) {
      if (t.type === "expense" && t.categoryName) {
        catMap[t.categoryName] = (catMap[t.categoryName] || 0) + t.amount;
      }
    }
    let topExpenseCategory: string | null = null;
    let topSpend = 0;
    for (const [name, amount] of Object.entries(catMap)) {
      if (amount > topSpend) {
        topSpend = amount;
        topExpenseCategory = name;
      }
    }

    return {
      totalBalance,
      totalIncomeThisMonth,
      totalExpensesThisMonth,
      netThisMonth: totalIncomeThisMonth - totalExpensesThisMonth,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      topExpenseCategory: topExpenseCategory || "Food & Dining",
    };
  }

  public getMonthlyTrend(months = 6): any[] {
    const transactions = this.getTransactions();
    const result: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleString("default", { month: "short", year: "numeric" });

      const mIncome = transactions
        .filter((t) => t.type === "income" && t.date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);
      const mExpenses = transactions
        .filter((t) => t.type === "expense" && t.date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        month: monthLabel,
        income: mIncome,
        expenses: mExpenses,
        net: mIncome - mExpenses,
      });
    }

    return result;
  }

  public getSpendingByCategory(): any[] {
    const transactions = this.getTransactions();
    const now = new Date();
    const prefix = now.toISOString().slice(0, 7);
    const thisMonthExpenses = transactions.filter((t) => t.type === "expense" && t.date.startsWith(prefix));

    const map: Record<string, { total: number; count: number; color?: string; icon?: string }> = {};
    for (const t of thisMonthExpenses) {
      const name = t.categoryName || "General";
      if (!map[name]) {
        map[name] = { total: 0, count: 0, color: t.categoryColor, icon: t.categoryIcon };
      }
      map[name].total += t.amount;
      map[name].count += 1;
    }

    return Object.entries(map).map(([categoryName, data]) => ({
      categoryName,
      total: data.total,
      count: data.count,
      categoryColor: data.color || "#3b82f6",
      categoryIcon: data.icon || "tag",
    }));
  }

  // ── Stock Ticker Fallback Data ───────────────────────────────────────────
  public getMarketStocks(): any {
    return {
      status: "ok",
      data: [
        { symbol: "AAPL", name: "Apple Inc.", price: 232.45, change: 1.85, percent: 0.8, changePercent: 0.8, isUp: true },
        { symbol: "NVDA", name: "NVIDIA Corp.", price: 138.25, change: 3.42, percent: 2.54, changePercent: 2.54, isUp: true },
        { symbol: "MSFT", name: "Microsoft Corp.", price: 428.1, change: -1.2, percent: -0.28, changePercent: -0.28, isUp: false },
        { symbol: "GOOGL", name: "Alphabet Inc.", price: 178.6, change: 0.95, percent: 0.54, changePercent: 0.54, isUp: true },
        { symbol: "AMZN", name: "Amazon.com Inc.", price: 194.3, change: 2.15, percent: 1.12, changePercent: 1.12, isUp: true },
      ],
    };
  }

  // ── Request Router ───────────────────────────────────────────────────────
  public handleRequest(method: string, url: string, body?: any): any {
    const parsedUrl = new URL(url, "http://localhost");
    const path = parsedUrl.pathname.replace(/\/+$/, "");
    const search = parsedUrl.searchParams;
    let parsedBody = body;
    if (typeof body === "string") {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = {};
      }
    }

    // Health
    if (path === "/api/healthz") {
      return { status: "ok" };
    }

    // Auth
    if (path === "/api/auth/me") {
      const savedUser = this.getItem<any>(STORAGE_KEYS.USER, { id: 1, username: "demouser" });
      return { id: 1, username: savedUser.username || "demouser", createdAt: new Date().toISOString() };
    }
    if (path === "/api/auth/register" || path === "/api/auth/login" || path === "/api/auth/firebase-sync") {
      const username = parsedBody?.username || (parsedBody?.email ? parsedBody.email.split("@")[0] : "user");
      const user = { id: 1, username, email: parsedBody?.email, createdAt: new Date().toISOString() };
      this.setItem(STORAGE_KEYS.USER, user);
      return user;
    }
    if (path === "/api/auth/logout") {
      this.setItem(STORAGE_KEYS.USER, { id: 1, username: "demouser" });
      return { message: "Logged out" };
    }
    if (path === "/api/auth/profile") {
      const user = this.getItem<any>(STORAGE_KEYS.USER, { id: 1, username: "demouser" });
      user.username = parsedBody?.username || user.username;
      this.setItem(STORAGE_KEYS.USER, user);
      return user;
    }

    // Demo Data Seed
    if (path === "/api/demo-data" && method === "POST") {
      const seeded = this.seedDemoData();
      return { message: "Sample data loaded successfully.", seeded };
    }

    // Admin Clear All
    if (path === "/api/admin/clear-all" && method === "DELETE") {
      this.clearAll();
      return { message: "Ledger cleared." };
    }

    // Accounts
    if (path === "/api/accounts") {
      if (method === "GET") return this.getAccounts();
      if (method === "POST") return this.createAccount(parsedBody);
    }
    const accountMatch = path.match(/^\/api\/accounts\/(\d+)$/);
    if (accountMatch) {
      const accId = parseInt(accountMatch[1], 10);
      if (method === "GET") return this.getAccounts().find((a) => a.id === accId) || null;
      if (method === "PATCH" || method === "PUT") return this.updateAccount(accId, parsedBody);
      if (method === "DELETE") return { success: this.deleteAccount(accId) };
    }

    // Categories
    if (path === "/api/categories") {
      if (method === "GET") return this.getCategories();
      if (method === "POST") return this.createCategory(parsedBody);
    }
    const catMatch = path.match(/^\/api\/categories\/(\d+)$/);
    if (catMatch) {
      const catId = parseInt(catMatch[1], 10);
      if (method === "DELETE") return { success: this.deleteCategory(catId) };
    }

    // Transactions
    if (path === "/api/transactions") {
      if (method === "GET") {
        return this.getTransactions({
          startDate: search.get("startDate") || undefined,
          endDate: search.get("endDate") || undefined,
          type: search.get("type") || undefined,
          limit: search.get("limit") ? parseInt(search.get("limit")!, 10) : undefined,
        });
      }
      if (method === "POST") return this.createTransaction(parsedBody);
    }
    const txMatch = path.match(/^\/api\/transactions\/(\d+)$/);
    if (txMatch) {
      const txId = parseInt(txMatch[1], 10);
      if (method === "DELETE") return { success: this.deleteTransaction(txId) };
    }

    // Subscriptions
    if (path === "/api/subscriptions") {
      if (method === "GET") return this.getSubscriptions();
      if (method === "POST") return this.createSubscription(parsedBody);
    }
    const subMatch = path.match(/^\/api\/subscriptions\/(\d+)$/);
    if (subMatch && method === "DELETE") {
      const subId = parseInt(subMatch[1], 10);
      return { success: this.deleteSubscription(subId) };
    }
    const subPayMatch = path.match(/^\/api\/subscriptions\/(\d+)\/pay$/);
    if (subPayMatch && method === "POST") {
      const subId = parseInt(subPayMatch[1], 10);
      return this.paySubscription(subId);
    }

    // Summary & Reports
    if (path === "/api/summary/overview" || path === "/api/summary") {
      return this.getSummaryOverview();
    }
    if (path === "/api/monthly-trend" || path === "/api/summary/monthly-trend") {
      const months = search.get("months") ? parseInt(search.get("months")!, 10) : 6;
      return this.getMonthlyTrend(months);
    }
    if (path === "/api/summary/spending-by-category" || path === "/api/summary/category-spending") {
      return this.getSpendingByCategory();
    }
    if (path === "/api/summary/recent") {
      const limit = search.get("limit") ? parseInt(search.get("limit")!, 10) : 10;
      return this.getTransactions({ limit });
    }

    // Market / Stocks
    if (path === "/api/market/stocks") {
      return this.getMarketStocks();
    }

    return undefined;
  }
}

export const localLedger = new LocalLedgerEngine();

/**
 * Installs global client-side fetch interceptor.
 * If any `/api/*` call fails to reach a live backend or receives HTML (static hosting rewrite),
 * it seamlessly intercepts and serves the request from the local ledger engine!
 */
export function setupLocalLedgerInterceptor(): void {
  if (typeof window === "undefined") return;

  // Make sure ledger has initial data
  localLedger.ensureInitialized();

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

    if (url.includes("/api/")) {
      const method = (init?.method || "GET").toUpperCase();

      // On Firebase Hosting or static hosting domains, serve immediately from client ledger with 0ms latency!
      const isStaticHosting =
        typeof window !== "undefined" &&
        (window.location.hostname.includes("web.app") ||
         window.location.hostname.includes("firebaseapp.com") ||
         window.location.hostname.includes("github.io"));

      if (isStaticHosting) {
        const fallbackData = localLedger.handleRequest(method, url, init?.body);
        if (fallbackData !== undefined) {
          return new Response(JSON.stringify(fallbackData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      try {
        const res = await originalFetch(input, init);
        const contentType = res.headers.get("content-type") || "";

        // If backend returned authentic JSON, pass it through directly!
        if (contentType.includes("application/json")) {
          return res;
        }

        // If backend returned HTML (e.g. single-page app rewrite on Firebase Hosting) or error, fallback:
        const fallbackData = localLedger.handleRequest(method, url, init?.body);
        if (fallbackData !== undefined) {
          return new Response(JSON.stringify(fallbackData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return res;
      } catch {
        // Network drop / offline fallback
        const fallbackData = localLedger.handleRequest(method, url, init?.body);
        if (fallbackData !== undefined) {
          return new Response(JSON.stringify(fallbackData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        throw new Error("Unable to connect to service.");
      }
    }

    return originalFetch(input, init);
  };
}

import { Router } from "express";
import { db } from "@workspace/db";
import {
  accountsTable,
  categoriesTable,
  transactionsTable,
  subscriptionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /demo-data — seed a clean, lightweight, realistic sample dataset
router.post("/demo-data", async (req, res) => {
  const userId = req.userId!;

  try {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };

    const daysFromNow = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().split("T")[0];
    };

    // ── 1. Clear existing user data (clean idempotent re-seed) ────────────────
    const existingAccounts = await db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId));

    for (const acc of existingAccounts) {
      await db
        .delete(subscriptionsTable)
        .where(eq(subscriptionsTable.accountId, acc.id));
      await db
        .delete(transactionsTable)
        .where(eq(transactionsTable.accountId, acc.id));
    }
    await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.userId, userId));
    await db
      .delete(accountsTable)
      .where(eq(accountsTable.userId, userId));

    // ── 2. Clean 3 Accounts (Checking, Savings, Credit Card) ──────────────────
    const insertedAccounts = await db
      .insert(accountsTable)
      .values([
        {
          userId,
          name: "Main Checking",
          type: "checking" as const,
          balance: "45000.00",
          currency: "INR",
          color: "#22c55e",
          icon: "landmark",
        },
        {
          userId,
          name: "High-Yield Savings",
          type: "savings" as const,
          balance: "120000.00",
          currency: "INR",
          color: "#3b82f6",
          icon: "piggy-bank",
        },
        {
          userId,
          name: "Credit Card",
          type: "credit_card" as const,
          balance: "-6500.00",
          currency: "INR",
          color: "#f43f5e",
          icon: "credit-card",
        },
      ])
      .returning();

    const [checking, savings, creditCard] = insertedAccounts;

    // ── 3. Focused Categories (10 essential categories) ──────────────────────
    const catDefs = [
      // Income
      { name: "Salary",          type: "income"  as const, color: "#22c55e", icon: "wallet", parentId: null },
      { name: "Freelance",       type: "income"  as const, color: "#10b981", icon: "briefcase", parentId: null },
      { name: "Investments",     type: "income"  as const, color: "#06b6d4", icon: "trending-up", parentId: null },
      // Expense
      { name: "Food & Dining",   type: "expense" as const, color: "#f97316", icon: "utensils", parentId: null },
      { name: "Groceries",       type: "expense" as const, color: "#65a30d", icon: "cart", parentId: null },
      { name: "Housing & Rent",   type: "expense" as const, color: "#8b5cf6", icon: "home", parentId: null },
      { name: "Transport",       type: "expense" as const, color: "#3b82f6", icon: "car", parentId: null },
      { name: "Utilities",       type: "expense" as const, color: "#14b8a6", icon: "zap", parentId: null },
      { name: "Entertainment",   type: "expense" as const, color: "#f43f5e", icon: "film", parentId: null },
      { name: "Healthcare",      type: "expense" as const, color: "#ef4444", icon: "activity", parentId: null },
    ];

    const insertedCats = await db
      .insert(categoriesTable)
      .values(catDefs.map((c) => ({ ...c, userId })))
      .returning();

    const catMap: Record<string, number> = {};
    for (const c of insertedCats) catMap[c.name] = c.id;

    // ── 4. Reduced High-Signal Transactions (16 clean records) ───────────────
    const txns: Array<{
      userId: number;
      accountId: number;
      amount: string;
      description: string;
      type: "income" | "expense";
      date: string;
      categoryId: number | null;
      notes: string | null;
    }> = [
      // Current Month
      { userId, accountId: checking.id,   amount: "85000", description: "Monthly Salary Deposit",  type: "income",  date: daysAgo(2),  categoryId: catMap["Salary"],        notes: "Direct payroll transfer" },
      { userId, accountId: checking.id,   amount: "22000", description: "Apartment Rent",         type: "expense", date: daysAgo(3),  categoryId: catMap["Housing & Rent"], notes: "Monthly lease" },
      { userId, accountId: creditCard.id, amount: "3450",  description: "Supermarket Groceries",   type: "expense", date: daysAgo(4),  categoryId: catMap["Groceries"],     notes: "Weekly pantry essentials" },
      { userId, accountId: creditCard.id, amount: "1680",  description: "Restaurant Dining",       type: "expense", date: daysAgo(6),  categoryId: catMap["Food & Dining"], notes: "Weekend dinner" },
      { userId, accountId: creditCard.id, amount: "2200",  description: "Fuel & Gas Station",      type: "expense", date: daysAgo(8),  categoryId: catMap["Transport"],     notes: "Full tank fill" },
      { userId, accountId: savings.id,    amount: "18000", description: "Freelance Project Milestone", type: "income", date: daysAgo(10), categoryId: catMap["Freelance"], notes: "UI/UX consulting" },
      { userId, accountId: checking.id,   amount: "1850",  description: "Electricity & Power Bill",type: "expense", date: daysAgo(12), categoryId: catMap["Utilities"],     notes: "Monthly utility invoice" },
      { userId, accountId: creditCard.id, amount: "620",   description: "Pharmacy & Medicines",    type: "expense", date: daysAgo(15), categoryId: catMap["Healthcare"],    notes: null },
      { userId, accountId: creditCard.id, amount: "380",   description: "Artisan Coffee & Bakery", type: "expense", date: daysAgo(17), categoryId: catMap["Food & Dining"], notes: null },
      { userId, accountId: creditCard.id, amount: "750",   description: "Cinema Movie Tickets",    type: "expense", date: daysAgo(20), categoryId: catMap["Entertainment"], notes: "Weekend show" },

      // Previous Month (for trend continuity)
      { userId, accountId: checking.id,   amount: "85000", description: "Previous Salary Deposit", type: "income",  date: daysAgo(32), categoryId: catMap["Salary"],        notes: "Direct payroll transfer" },
      { userId, accountId: checking.id,   amount: "22000", description: "Apartment Rent",         type: "expense", date: daysAgo(33), categoryId: catMap["Housing & Rent"], notes: "Monthly lease" },
      { userId, accountId: checking.id,   amount: "4200",  description: "Groceries Monthly Restock", type: "expense", date: daysAgo(35), categoryId: catMap["Groceries"],   notes: null },
      { userId, accountId: savings.id,    amount: "3200",  description: "Stock Portfolio Dividend",type: "income",  date: daysAgo(38), categoryId: catMap["Investments"],   notes: "Quarterly yield" },
      { userId, accountId: creditCard.id, amount: "2100",  description: "Dinner with Colleagues",  type: "expense", date: daysAgo(40), categoryId: catMap["Food & Dining"], notes: null },
      { userId, accountId: checking.id,   amount: "3500",  description: "Car Maintenance & Service", type: "expense", date: daysAgo(42), categoryId: catMap["Transport"],   notes: "Periodic servicing" },
    ];

    await db.insert(transactionsTable).values(txns);

    // ── 5. Compact 3 Core Subscriptions ──────────────────────────────────────
    await db.insert(subscriptionsTable).values([
      {
        userId,
        name: "Fiber Internet",
        amount: "1199",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(3),
        accountId: checking.id,
        categoryId: catMap["Utilities"],
        isActive: true,
        notes: "High-speed broadband",
      },
      {
        userId,
        name: "Netflix Streaming",
        amount: "649",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(7),
        accountId: creditCard.id,
        categoryId: catMap["Entertainment"],
        isActive: true,
        notes: "4K Family Plan",
      },
      {
        userId,
        name: "Electricity Utility",
        amount: "2200",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(12),
        accountId: checking.id,
        categoryId: catMap["Utilities"],
        isActive: true,
        notes: "Power grid bill",
      },
    ]);

    res.status(201).json({
      message: "Sample data loaded successfully.",
      seeded: {
        accounts: insertedAccounts.length,
        categories: insertedCats.length,
        transactions: txns.length,
        subscriptions: 3,
      },
    });
  } catch (err) {
    console.error("Demo data error:", err);
    res.status(500).json({ error: "Failed to load demo data", detail: String(err) });
  }
});

export default router;

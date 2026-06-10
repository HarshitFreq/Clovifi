import { Router } from "express";
import { db } from "@workspace/db";
import { accountsTable, categoriesTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /demo-data — seed realistic demo transactions for first-time users
router.post("/demo-data", async (req, res) => {
  const userId = req.userId!;

  try {
    // Get user's first account and categories
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
    const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));

    if (accounts.length === 0) {
      res.status(400).json({ error: "No accounts found. Create an account first." });
      return;
    }

    const accountId = accounts[0].id;
    const catMap: Record<string, number> = {};
    for (const c of categories) catMap[c.name] = c.id;

    // Helper: date string N days ago
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };

    const transactions = [
      // Income
      { amount: "85000", description: "Monthly Salary", type: "income" as const, date: daysAgo(1),  categoryId: catMap["Salary"] },
      { amount: "15000", description: "Freelance Project",type: "income" as const, date: daysAgo(8),  categoryId: catMap["Freelance"] },
      { amount: "5200",  description: "Stock Dividends",  type: "income" as const, date: daysAgo(15), categoryId: catMap["Investments"] },
      // Expenses
      { amount: "12000", description: "Monthly Rent",       type: "expense" as const, date: daysAgo(2),  categoryId: catMap["Housing & Rent"] },
      { amount: "3200",  description: "Grocery Shopping",   type: "expense" as const, date: daysAgo(3),  categoryId: catMap["Food & Dining"] },
      { amount: "850",   description: "Uber Rides",         type: "expense" as const, date: daysAgo(4),  categoryId: catMap["Transport"] },
      { amount: "1500",  description: "Netflix & Spotify",  type: "expense" as const, date: daysAgo(5),  categoryId: catMap["Entertainment"] },
      { amount: "2400",  description: "Electricity Bill",   type: "expense" as const, date: daysAgo(6),  categoryId: catMap["Utilities"] },
      { amount: "4500",  description: "Restaurant Dinner",  type: "expense" as const, date: daysAgo(7),  categoryId: catMap["Food & Dining"] },
      { amount: "6000",  description: "Online Shopping",    type: "expense" as const, date: daysAgo(9),  categoryId: catMap["Shopping"] },
      { amount: "1200",  description: "Gym Membership",     type: "expense" as const, date: daysAgo(10), categoryId: catMap["Health & Fitness"] },
      { amount: "3500",  description: "Weekend Trip",       type: "expense" as const, date: daysAgo(12), categoryId: catMap["Travel"] },
      { amount: "800",   description: "Online Course",      type: "expense" as const, date: daysAgo(14), categoryId: catMap["Education"] },
      { amount: "1800",  description: "Petrol",             type: "expense" as const, date: daysAgo(16), categoryId: catMap["Transport"] },
      { amount: "2100",  description: "Swiggy & Zomato",   type: "expense" as const, date: daysAgo(18), categoryId: catMap["Food & Dining"] },
    ];

    await db.insert(transactionsTable).values(
      transactions.map((t) => ({
        userId,
        accountId,
        amount: t.amount,
        description: t.description,
        type: t.type,
        date: t.date,
        categoryId: t.categoryId ?? null,
        notes: null,
      }))
    );

    res.status(201).json({ message: "Demo data loaded successfully", count: transactions.length });
  } catch (err) {
    console.error("Demo data error:", err);
    res.status(500).json({ error: "Failed to load demo data" });
  }
});

export default router;

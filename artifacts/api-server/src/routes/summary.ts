import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db";
import { eq, sql, desc, gte, lte, and } from "drizzle-orm";

const router = Router();

router.get("/summary/overview", async (req, res) => {
  const userId = req.userId!;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [balanceRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(balance), 0)` })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId));

  const [accountCountRow] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId));

  const [txCountRow] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const monthlyRows = await db
    .select({
      type: transactionsTable.type,
      total: sql<string>`COALESCE(SUM(amount), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, firstOfMonth),
        lte(transactionsTable.date, lastOfMonth)
      )
    )
    .groupBy(transactionsTable.type);

  let totalExpensesThisMonth = 0;
  let totalIncomeThisMonth = 0;
  for (const row of monthlyRows) {
    if (row.type === "expense") totalExpensesThisMonth = parseFloat(row.total);
    else totalIncomeThisMonth = parseFloat(row.total);
  }

  // Top expense category this month
  const topCategoryRows = await db
    .select({
      name: categoriesTable.name,
      total: sql<string>`SUM(${transactionsTable.amount})`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, firstOfMonth),
        lte(transactionsTable.date, lastOfMonth)
      )
    )
    .groupBy(categoriesTable.name)
    .orderBy(desc(sql`SUM(${transactionsTable.amount})`))
    .limit(1);

  res.json({
    totalBalance: parseFloat(balanceRow.total),
    totalExpensesThisMonth,
    totalIncomeThisMonth,
    netThisMonth: totalIncomeThisMonth - totalExpensesThisMonth,
    accountCount: parseInt(accountCountRow.count),
    transactionCount: parseInt(txCountRow.count),
    topExpenseCategory: topCategoryRows[0]?.name ?? null,
  });
});

router.get("/summary/spending-by-category", async (req, res) => {
  const userId = req.userId!;
  const filters: any[] = [];
  if (req.query.startDate) filters.push(gte(transactionsTable.date, req.query.startDate as string));
  if (req.query.endDate) filters.push(lte(transactionsTable.date, req.query.endDate as string));

  const rows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      total: sql<string>`SUM(${transactionsTable.amount})`,
      count: sql<string>`COUNT(*)`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "expense"),
        ...(filters.length > 0 ? filters : [])
      )
    )
    .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.color)
    .orderBy(desc(sql`SUM(${transactionsTable.amount})`));

  res.json(
    rows.map((r) => ({
      categoryId: r.categoryId ?? null,
      categoryName: r.categoryName ?? "Uncategorized",
      categoryColor: r.categoryColor ?? "#94a3b8",
      total: parseFloat(r.total),
      count: parseInt(r.count),
    }))
  );
});

router.get("/summary/monthly-trend", async (req, res) => {
  const userId = req.userId!;
  const months = req.query.months ? parseInt(req.query.months as string) : 6;

  // Compute cutoff date in JS to avoid SQL injection issues
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const rows = await db
    .select({
      year: sql<number>`EXTRACT(YEAR FROM date::date)::int`,
      month: sql<number>`EXTRACT(MONTH FROM date::date)::int`,
      type: transactionsTable.type,
      total: sql<string>`SUM(${transactionsTable.amount})`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, cutoffStr)
      )
    )
    .groupBy(
      sql`EXTRACT(YEAR FROM date::date)`,
      sql`EXTRACT(MONTH FROM date::date)`,
      transactionsTable.type
    )
    .orderBy(
      sql`EXTRACT(YEAR FROM date::date)`,
      sql`EXTRACT(MONTH FROM date::date)`
    );

  const monthMap: Record<string, { year: number; month: number; expenses: number; income: number }> = {};
  for (const r of rows) {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    if (!monthMap[key]) monthMap[key] = { year: r.year, month: r.month, expenses: 0, income: 0 };
    if (r.type === "expense") monthMap[key].expenses = parseFloat(r.total);
    else monthMap[key].income = parseFloat(r.total);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  res.json(
    Object.entries(monthMap).map(([, v]) => ({
      month: v.month,
      year: v.year,
      label: `${monthNames[v.month - 1]} ${v.year}`,
      expenses: v.expenses,
      income: v.income,
      net: v.income - v.expenses,
    }))
  );
});

router.get("/summary/recent-transactions", async (req, res) => {
  const userId = req.userId!;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const rows = await db
    .select({
      tx: transactionsTable,
      accountName: accountsTable.name,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      id: r.tx.id,
      amount: parseFloat(r.tx.amount),
      description: r.tx.description,
      type: r.tx.type,
      date: r.tx.date,
      accountId: r.tx.accountId,
      accountName: r.accountName ?? null,
      categoryId: r.tx.categoryId ?? null,
      categoryName: r.categoryName ?? null,
      categoryColor: r.categoryColor ?? null,
      notes: r.tx.notes ?? null,
      createdAt: r.tx.createdAt.toISOString(),
    }))
  );
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db";
import { eq, desc, gte, lte, and, SQL } from "drizzle-orm";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  ListTransactionsQueryParams,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router = Router();

function formatTx(tx: Record<string, unknown>, accountName?: string | null, categoryName?: string | null, categoryColor?: string | null) {
  return {
    id: tx.id,
    amount: parseFloat(tx.amount as string),
    description: tx.description,
    type: tx.type,
    date: tx.date,
    accountId: tx.accountId,
    accountName: accountName ?? null,
    categoryId: tx.categoryId ?? null,
    categoryName: categoryName ?? null,
    categoryColor: categoryColor ?? null,
    notes: tx.notes ?? null,
    createdAt: (tx.createdAt as Date).toISOString(),
  };
}

router.get("/transactions", async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse({
    accountId: req.query.accountId ? parseInt(req.query.accountId as string) : undefined,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
    type: req.query.type,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  });

  const filters: SQL[] = [];
  if (parsed.success) {
    const d = parsed.data;
    if (d.accountId) filters.push(eq(transactionsTable.accountId, d.accountId));
    if (d.categoryId) filters.push(eq(transactionsTable.categoryId, d.categoryId));
    if (d.type) filters.push(eq(transactionsTable.type, d.type));
    if (d.startDate) filters.push(gte(transactionsTable.date, d.startDate as string));
    if (d.endDate) filters.push(lte(transactionsTable.date, d.endDate as string));
  }

  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 100;
  const offset = parsed.success && parsed.data.offset ? parsed.data.offset : 0;

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
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(
    rows.map((r) =>
      formatTx(r.tx as unknown as Record<string, unknown>, r.accountName, r.categoryName, r.categoryColor)
    )
  );
});

router.post("/transactions", async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const d = parsed.data;

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      amount: String(d.amount),
      description: d.description,
      type: d.type ?? "expense",
      date: d.date,
      accountId: d.accountId,
      categoryId: d.categoryId ?? null,
      notes: d.notes ?? null,
    })
    .returning();

  // Update account balance
  const account = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, d.accountId))
    .then((r) => r[0]);

  if (account) {
    const current = parseFloat(account.balance);
    const delta = d.type === "expense" ? -d.amount : d.amount;
    await db
      .update(accountsTable)
      .set({ balance: String(current + delta) })
      .where(eq(accountsTable.id, d.accountId));
  }

  const [joinedTx] = await db
    .select({
      tx: transactionsTable,
      accountName: accountsTable.name,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, tx.id));

  res.status(201).json(
    formatTx(
      joinedTx.tx as unknown as Record<string, unknown>,
      joinedTx.accountName,
      joinedTx.categoryName,
      joinedTx.categoryColor
    )
  );
});

router.get("/transactions/:id", async (req, res) => {
  const parsed = GetTransactionParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({
      tx: transactionsTable,
      accountName: accountsTable.name,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(formatTx(row.tx as unknown as Record<string, unknown>, row.accountName, row.categoryName, row.categoryColor));
});

router.patch("/transactions/:id", async (req, res) => {
  const paramsParsed = UpdateTransactionParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateTransactionBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  // Fetch original to reverse balance adjustment
  const [original] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, paramsParsed.data.id));
  if (!original) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const d = bodyParsed.data;
  const updates: Record<string, unknown> = {};
  if (d.amount !== undefined) updates.amount = String(d.amount);
  if (d.description !== undefined) updates.description = d.description;
  if (d.type !== undefined) updates.type = d.type;
  if (d.date !== undefined) updates.date = d.date;
  if (d.accountId !== undefined) updates.accountId = d.accountId;
  if (d.categoryId !== undefined) updates.categoryId = d.categoryId;
  if (d.notes !== undefined) updates.notes = d.notes;

  const [updatedTx] = await db
    .update(transactionsTable)
    .set(updates)
    .where(eq(transactionsTable.id, paramsParsed.data.id))
    .returning();

  // Reverse old balance effect and apply new
  const account = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, original.accountId))
    .then((r) => r[0]);
  if (account) {
    const oldDelta = original.type === "expense" ? -parseFloat(original.amount) : parseFloat(original.amount);
    const newAmount = d.amount ?? parseFloat(original.amount);
    const newType = d.type ?? original.type;
    const newDelta = newType === "expense" ? -newAmount : newAmount;
    const newBalance = parseFloat(account.balance) - oldDelta + newDelta;
    await db
      .update(accountsTable)
      .set({ balance: String(newBalance) })
      .where(eq(accountsTable.id, original.accountId));
  }

  const [joinedTx] = await db
    .select({
      tx: transactionsTable,
      accountName: accountsTable.name,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
    })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, updatedTx.id));

  res.json(
    formatTx(
      joinedTx.tx as unknown as Record<string, unknown>,
      joinedTx.accountName,
      joinedTx.categoryName,
      joinedTx.categoryColor
    )
  );
});

router.delete("/transactions/:id", async (req, res) => {
  const parsed = DeleteTransactionParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, parsed.data.id));

  if (tx) {
    // Reverse the balance effect
    const account = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, tx.accountId))
      .then((r) => r[0]);
    if (account) {
      const delta = tx.type === "expense" ? parseFloat(tx.amount) : -parseFloat(tx.amount);
      await db
        .update(accountsTable)
        .set({ balance: String(parseFloat(account.balance) + delta) })
        .where(eq(accountsTable.id, tx.accountId));
    }
    await db.delete(transactionsTable).where(eq(transactionsTable.id, parsed.data.id));
  }

  res.status(204).send();
});

export default router;

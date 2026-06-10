import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db";
import { eq, desc, gte, lte, and, sql, SQL } from "drizzle-orm";
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

/** Return the signed delta to apply to an account balance for a given tx type/amount. */
function balanceDelta(type: string, amount: number): number {
  return type === "expense" ? -amount : amount;
}

router.get("/transactions", async (req, res) => {
  const userId = req.userId!;
  const parsed = ListTransactionsQueryParams.safeParse({
    accountId: req.query.accountId ? parseInt(req.query.accountId as string) : undefined,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
    type: req.query.type,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  });

  const filters: SQL[] = [eq(transactionsTable.userId, userId)];
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
    .where(and(...filters))
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
  const userId = req.userId!;
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const d = parsed.data;

  // Verify account belongs to user
  const [accountCheck] = await db
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.id, d.accountId), eq(accountsTable.userId, userId)));
  if (!accountCheck) {
    res.status(400).json({ error: "Account not found or access denied" });
    return;
  }

  // Verify category belongs to user if specified
  if (d.categoryId) {
    const [categoryCheck] = await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, d.categoryId), eq(categoriesTable.userId, userId)));
    if (!categoryCheck) {
      res.status(400).json({ error: "Category not found or access denied" });
      return;
    }
  }

  // Run insert + balance update atomically inside a DB transaction to prevent
  // race conditions where concurrent requests read the same stale balance.
  const tx = await db.transaction(async (trx) => {
    const [inserted] = await trx
      .insert(transactionsTable)
      .values({
        userId,
        amount: String(d.amount),
        description: d.description,
        type: d.type ?? "expense",
        date: d.date,
        accountId: d.accountId,
        categoryId: d.categoryId ?? null,
        notes: d.notes ?? null,
      })
      .returning();

    // Atomic balance update — no read-then-write, safe under concurrency
    const delta = balanceDelta(inserted.type, parseFloat(inserted.amount));
    await trx
      .update(accountsTable)
      .set({ balance: sql`balance + ${String(delta)}` })
      .where(and(eq(accountsTable.id, inserted.accountId), eq(accountsTable.userId, userId)));

    return inserted;
  });

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
    .where(and(eq(transactionsTable.id, tx.id), eq(transactionsTable.userId, userId)));

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
  const userId = req.userId!;
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
    .where(and(eq(transactionsTable.id, parsed.data.id), eq(transactionsTable.userId, userId)));

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(formatTx(row.tx as unknown as Record<string, unknown>, row.accountName, row.categoryName, row.categoryColor));
});

router.patch("/transactions/:id", async (req, res) => {
  const userId = req.userId!;
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

  const d = bodyParsed.data;

  // Verify target account ownership if it's changing
  if (d.accountId !== undefined) {
    const [accountCheck] = await db
      .select()
      .from(accountsTable)
      .where(and(eq(accountsTable.id, d.accountId), eq(accountsTable.userId, userId)));
    if (!accountCheck) {
      res.status(400).json({ error: "Account not found or access denied" });
      return;
    }
  }

  // Verify target category ownership if it's changing
  if (d.categoryId !== undefined && d.categoryId !== null) {
    const [categoryCheck] = await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, d.categoryId), eq(categoriesTable.userId, userId)));
    if (!categoryCheck) {
      res.status(400).json({ error: "Category not found or access denied" });
      return;
    }
  }

  // All reads, writes, and balance adjustments happen inside a single DB transaction
  // to prevent races and ensure the account-change case is handled correctly.
  const updatedTx = await db.transaction(async (trx) => {
    // Lock the original row so concurrent patches can't race
    const [original] = await trx
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.id, paramsParsed.data.id), eq(transactionsTable.userId, userId)))
      .for("update");

    if (!original) return null;

    const updates: Record<string, unknown> = {};
    if (d.amount !== undefined) updates.amount = String(d.amount);
    if (d.description !== undefined) updates.description = d.description;
    if (d.type !== undefined) updates.type = d.type;
    if (d.date !== undefined) updates.date = d.date;
    if (d.accountId !== undefined) updates.accountId = d.accountId;
    if (d.categoryId !== undefined) updates.categoryId = d.categoryId;
    if (d.notes !== undefined) updates.notes = d.notes;

    const [updated] = await trx
      .update(transactionsTable)
      .set(updates)
      .where(and(eq(transactionsTable.id, paramsParsed.data.id), eq(transactionsTable.userId, userId)))
      .returning();

    const oldAccountId = original.accountId;
    const newAccountId = updated.accountId;
    const accountChanged = oldAccountId !== newAccountId;

    const oldDelta = balanceDelta(original.type, parseFloat(original.amount));
    const newDelta = balanceDelta(updated.type, parseFloat(updated.amount));

    if (accountChanged) {
      // Reverse the old transaction's effect from the original account
      await trx
        .update(accountsTable)
        .set({ balance: sql`balance + ${String(-oldDelta)}` })
        .where(and(eq(accountsTable.id, oldAccountId), eq(accountsTable.userId, userId)));

      // Apply the new transaction's effect to the new account
      await trx
        .update(accountsTable)
        .set({ balance: sql`balance + ${String(newDelta)}` })
        .where(and(eq(accountsTable.id, newAccountId), eq(accountsTable.userId, userId)));
    } else {
      // Same account — apply the net delta atomically
      const netDelta = newDelta - oldDelta;
      await trx
        .update(accountsTable)
        .set({ balance: sql`balance + ${String(netDelta)}` })
        .where(and(eq(accountsTable.id, oldAccountId), eq(accountsTable.userId, userId)));
    }

    return updated;
  });

  if (!updatedTx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
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
    .where(and(eq(transactionsTable.id, updatedTx.id), eq(transactionsTable.userId, userId)));

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
  const userId = req.userId!;
  const parsed = DeleteTransactionParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  // Delete + balance reversal inside a single DB transaction to prevent races
  const success = await db.transaction(async (trx) => {
    const [tx] = await trx
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.id, parsed.data.id), eq(transactionsTable.userId, userId)))
      .for("update");

    if (!tx) return false;

    await trx
      .delete(transactionsTable)
      .where(and(eq(transactionsTable.id, parsed.data.id), eq(transactionsTable.userId, userId)));

    // Reverse the balance effect atomically
    const delta = balanceDelta(tx.type, parseFloat(tx.amount));
    await trx
      .update(accountsTable)
      .set({ balance: sql`balance + ${String(-delta)}` })
      .where(and(eq(accountsTable.id, tx.accountId), eq(accountsTable.userId, userId)));

    return true;
  });

  if (!success) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.status(204).send();
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, accountsTable, categoriesTable, transactionsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  CreateSubscriptionBody,
  UpdateSubscriptionBody,
} from "@workspace/api-zod";

const router = Router();

function formatSub(
  sub: Record<string, unknown>,
  accountName?: string | null,
  categoryName?: string | null,
  categoryColor?: string | null
) {
  return {
    id: sub.id,
    name: sub.name,
    amount: parseFloat(sub.amount as string),
    type: sub.type,
    interval: sub.interval,
    nextDueDate: sub.nextDueDate,
    accountId: sub.accountId,
    accountName: accountName ?? null,
    categoryId: sub.categoryId ?? null,
    categoryName: categoryName ?? null,
    categoryColor: categoryColor ?? null,
    isActive: sub.isActive,
    notes: sub.notes ?? null,
    createdAt: (sub.createdAt as Date).toISOString(),
  };
}

function balanceDelta(type: string, amount: number): number {
  return type === "expense" ? -amount : amount;
}

function advanceDate(dateStr: string, interval: string): string {
  const parts = dateStr.split("-").map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  
  if (interval === "weekly") {
    dt.setDate(dt.getDate() + 7);
  } else if (interval === "yearly") {
    dt.setFullYear(dt.getFullYear() + 1);
  } else {
    // Default to monthly
    dt.setMonth(dt.getMonth() + 1);
  }
  
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// GET /subscriptions
router.get("/subscriptions", async (req, res) => {
  try {
    const userId = req.userId!;
    const rows = await db
      .select({
        sub: subscriptionsTable,
        accountName: accountsTable.name,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
      })
      .from(subscriptionsTable)
      .leftJoin(accountsTable, eq(subscriptionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(subscriptionsTable.categoryId, categoriesTable.id))
      .where(eq(subscriptionsTable.userId, userId))
      .orderBy(desc(subscriptionsTable.nextDueDate));

    res.json(
      rows.map((r) =>
        formatSub(
          r.sub as unknown as Record<string, unknown>,
          r.accountName,
          r.categoryName,
          r.categoryColor
        )
      )
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// GET /subscriptions/:id
router.get("/subscriptions/:id", async (req, res) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid subscription ID" });
      return;
    }

    const [row] = await db
      .select({
        sub: subscriptionsTable,
        accountName: accountsTable.name,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
      })
      .from(subscriptionsTable)
      .leftJoin(accountsTable, eq(subscriptionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(subscriptionsTable.categoryId, categoriesTable.id))
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    if (!row) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    res.json(
      formatSub(
        row.sub as unknown as Record<string, unknown>,
        row.accountName,
        row.categoryName,
        row.categoryColor
      )
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// POST /subscriptions
router.post("/subscriptions", async (req, res) => {
  try {
    const userId = req.userId!;
    const parsed = CreateSubscriptionBody.safeParse(req.body);
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

    const [inserted] = await db
      .insert(subscriptionsTable)
      .values({
        userId,
        name: d.name,
        amount: String(d.amount),
        type: d.type ?? "expense",
        interval: d.interval ?? "monthly",
        nextDueDate: d.nextDueDate,
        accountId: d.accountId,
        categoryId: d.categoryId ?? null,
        notes: d.notes ?? null,
        isActive: d.isActive ?? true,
      })
      .returning();

    const [row] = await db
      .select({
        sub: subscriptionsTable,
        accountName: accountsTable.name,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
      })
      .from(subscriptionsTable)
      .leftJoin(accountsTable, eq(subscriptionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(subscriptionsTable.categoryId, categoriesTable.id))
      .where(and(eq(subscriptionsTable.id, inserted.id), eq(subscriptionsTable.userId, userId)));

    res.status(201).json(
      formatSub(
        row.sub as unknown as Record<string, unknown>,
        row.accountName,
        row.categoryName,
        row.categoryColor
      )
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// PATCH /subscriptions/:id
router.patch("/subscriptions/:id", async (req, res) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid subscription ID" });
      return;
    }

    const parsed = UpdateSubscriptionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const d = parsed.data;

    const [existing] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

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

    const updateData: any = {};
    if (d.name !== undefined) updateData.name = d.name;
    if (d.amount !== undefined) updateData.amount = String(d.amount);
    if (d.type !== undefined) updateData.type = d.type;
    if (d.interval !== undefined) updateData.interval = d.interval;
    if (d.nextDueDate !== undefined) updateData.nextDueDate = d.nextDueDate;
    if (d.accountId !== undefined) updateData.accountId = d.accountId;
    if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
    if (d.notes !== undefined) updateData.notes = d.notes;
    if (d.isActive !== undefined) updateData.isActive = d.isActive;

    await db
      .update(subscriptionsTable)
      .set(updateData)
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    const [row] = await db
      .select({
        sub: subscriptionsTable,
        accountName: accountsTable.name,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
      })
      .from(subscriptionsTable)
      .leftJoin(accountsTable, eq(subscriptionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(subscriptionsTable.categoryId, categoriesTable.id))
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    res.json(
      formatSub(
        row.sub as unknown as Record<string, unknown>,
        row.accountName,
        row.categoryName,
        row.categoryColor
      )
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// DELETE /subscriptions/:id
router.delete("/subscriptions/:id", async (req, res) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid subscription ID" });
      return;
    }

    const [existing] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    await db.delete(subscriptionsTable).where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// POST /subscriptions/:id/pay
router.post("/subscriptions/:id/pay", async (req, res) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid subscription ID" });
      return;
    }

    // 1. Fetch the subscription
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    if (!sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    // 2. Perform transaction generation, account balance adjustment, and due date advancement atomically
    await db.transaction(async (trx) => {
      // Create a new transaction in the ledger
      await trx.insert(transactionsTable).values({
        userId,
        amount: sub.amount,
        description: `Recurring: ${sub.name}`,
        type: sub.type,
        date: sub.nextDueDate,
        accountId: sub.accountId,
        categoryId: sub.categoryId ?? null,
        notes: `Auto-recorded payment from Clovifi Subscription Scheduler.`,
      });

      // Update the linked account balance
      const delta = balanceDelta(sub.type, parseFloat(sub.amount));
      await trx
        .update(accountsTable)
        .set({ balance: sql`balance + ${String(delta)}` })
        .where(and(eq(accountsTable.id, sub.accountId), eq(accountsTable.userId, userId)));

      // Advance next due date
      const nextDate = advanceDate(sub.nextDueDate, sub.interval);
      await trx
        .update(subscriptionsTable)
        .set({ nextDueDate: nextDate })
        .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));
    });

    // 3. Return the updated subscription details
    const [row] = await db
      .select({
        sub: subscriptionsTable,
        accountName: accountsTable.name,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
      })
      .from(subscriptionsTable)
      .leftJoin(accountsTable, eq(subscriptionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(subscriptionsTable.categoryId, categoriesTable.id))
      .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)));

    res.json(
      formatSub(
        row.sub as unknown as Record<string, unknown>,
        row.accountName,
        row.categoryName,
        row.categoryColor
      )
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAccountBody,
  UpdateAccountBody,
  GetAccountParams,
  UpdateAccountParams,
  DeleteAccountParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/accounts", async (req, res) => {
  const accounts = await db
    .select()
    .from(accountsTable)
    .orderBy(accountsTable.createdAt);

  res.json(
    accounts.map((a) => ({
      ...a,
      balance: parseFloat(a.balance),
      createdAt: a.createdAt.toISOString(),
    }))
  );
});

router.post("/accounts", async (req, res) => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, type, balance, currency, color, icon } = parsed.data;
  const [account] = await db
    .insert(accountsTable)
    .values({
      name,
      type: type ?? "checking",
      balance: String(balance ?? 0),
      currency: currency ?? "USD",
      color: color ?? null,
      icon: icon ?? null,
    })
    .returning();
  res.status(201).json({
    ...account,
    balance: parseFloat(account.balance),
    createdAt: account.createdAt.toISOString(),
  });
});

router.get("/accounts/:id", async (req, res) => {
  const parsed = GetAccountParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [account] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, parsed.data.id));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({
    ...account,
    balance: parseFloat(account.balance),
    createdAt: account.createdAt.toISOString(),
  });
});

router.patch("/accounts/:id", async (req, res) => {
  const paramsParsed = UpdateAccountParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateAccountBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const updates: Record<string, unknown> = {};
  const d = bodyParsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.type !== undefined) updates.type = d.type;
  if (d.balance !== undefined) updates.balance = String(d.balance);
  if (d.currency !== undefined) updates.currency = d.currency;
  if (d.color !== undefined) updates.color = d.color;
  if (d.icon !== undefined) updates.icon = d.icon;

  const [account] = await db
    .update(accountsTable)
    .set(updates)
    .where(eq(accountsTable.id, paramsParsed.data.id))
    .returning();
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({
    ...account,
    balance: parseFloat(account.balance),
    createdAt: account.createdAt.toISOString(),
  });
});

router.delete("/accounts/:id", async (req, res) => {
  const parsed = DeleteAccountParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(accountsTable).where(eq(accountsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;

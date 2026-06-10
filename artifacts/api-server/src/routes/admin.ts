import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db";

const router = Router();

router.delete("/admin/clear-all", async (req, res) => {
  await db.delete(transactionsTable);
  await db.delete(accountsTable);
  await db.delete(categoriesTable);
  res.json({ ok: true, message: "All data cleared." });
});

export default router;

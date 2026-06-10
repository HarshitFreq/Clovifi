import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (req, res) => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.name);
  res.json(categories);
});

router.post("/categories", async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [category] = await db
    .insert(categoriesTable)
    .values({
      name: parsed.data.name,
      type: parsed.data.type ?? "expense",
      color: parsed.data.color ?? "#4A90D9",
      icon: parsed.data.icon ?? null,
    })
    .returning();
  res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res) => {
  const paramsParsed = UpdateCategoryParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateCategoryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const updates: Record<string, unknown> = {};
  const d = bodyParsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.type !== undefined) updates.type = d.type;
  if (d.color !== undefined) updates.color = d.color;
  if (d.icon !== undefined) updates.icon = d.icon;

  const [category] = await db
    .update(categoriesTable)
    .set(updates)
    .where(eq(categoriesTable.id, paramsParsed.data.id))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

router.delete("/categories/:id", async (req, res) => {
  const parsed = DeleteCategoryParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;

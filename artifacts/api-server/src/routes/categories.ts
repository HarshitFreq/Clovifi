import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (req, res) => {
  const userId = req.userId!;
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, userId))
    .orderBy(categoriesTable.name);
  res.json(categories);
});

router.post("/categories", async (req, res) => {
  const userId = req.userId!;
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [category] = await db
    .insert(categoriesTable)
    .values({
      userId,
      name: parsed.data.name,
      type: parsed.data.type ?? "expense",
      color: parsed.data.color ?? "#4A90D9",
      icon: parsed.data.icon ?? null,
      parentId: parsed.data.parentId ?? null,
    })
    .returning();
  res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res) => {
  const userId = req.userId!;
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
  if (d.parentId !== undefined) updates.parentId = d.parentId;

  const [category] = await db
    .update(categoriesTable)
    .set(updates)
    .where(and(eq(categoriesTable.id, paramsParsed.data.id), eq(categoriesTable.userId, userId)))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

router.delete("/categories/:id", async (req, res) => {
  const userId = req.userId!;
  const parsed = DeleteCategoryParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deletedCategory] = await db
    .delete(categoriesTable)
    .where(and(eq(categoriesTable.id, parsed.data.id), eq(categoriesTable.userId, userId)))
    .returning();
  if (!deletedCategory) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.status(204).send();
});

export default router;

import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  timestamp,
  date,
  index,
  check,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { accountsTable } from "./accounts";
import { categoriesTable } from "./categories";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", ["expense", "income"]);

export const transactionsTable = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description").notNull(),
    type: transactionTypeEnum("type").notNull().default("expense"),
    date: date("date").notNull(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_type_idx").on(table.type),
    index("transactions_date_idx").on(table.date),
    // Composite index for the most common list query (account + date desc)
    index("transactions_account_date_idx").on(table.accountId, table.date),
    check("amount_positive", sql`amount > 0`),
  ]
);

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  timestamp,
  date,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { accountsTable } from "./accounts";
import { categoriesTable } from "./categories";
import { transactionTypeEnum } from "./transactions";
import { usersTable } from "./users";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull().default("expense"),
    interval: text("interval").notNull().default("monthly"), // "monthly" | "weekly" | "yearly"
    nextDueDate: date("next_due_date").notNull(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("subscriptions_account_id_idx").on(table.accountId),
    index("subscriptions_category_id_idx").on(table.categoryId),
    index("subscriptions_next_due_date_idx").on(table.nextDueDate),
  ]
);

export const subscriptionsRelations = relations(subscriptionsTable, ({ one }) => ({
  account: one(accountsTable, {
    fields: [subscriptionsTable.accountId],
    references: [accountsTable.id],
  }),
  category: one(categoriesTable, {
    fields: [subscriptionsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

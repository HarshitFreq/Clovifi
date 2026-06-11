import { Router } from "express";
import { db } from "@workspace/db";
import {
  accountsTable,
  categoriesTable,
  transactionsTable,
  subscriptionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /demo-data — seed rich realistic demo data for testing every feature
router.post("/demo-data", async (req, res) => {
  const userId = req.userId!;

  try {
    // ── Helper: date string N days ago ───────────────────────────────────────
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };

    const daysFromNow = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().split("T")[0];
    };

    // ── 1. Clear existing data (idempotent re-seed) ──────────────────────────
    const existingAccounts = await db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId));

    for (const acc of existingAccounts) {
      await db
        .delete(subscriptionsTable)
        .where(eq(subscriptionsTable.accountId, acc.id));
      await db
        .delete(transactionsTable)
        .where(eq(transactionsTable.accountId, acc.id));
    }
    await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.userId, userId));
    await db
      .delete(accountsTable)
      .where(eq(accountsTable.userId, userId));

    // ── 2. Accounts ──────────────────────────────────────────────────────────
    const insertedAccounts = await db
      .insert(accountsTable)
      .values([
        {
          userId,
          name: "Main Checking",
          type: "checking" as const,
          balance: "142500.00",
          currency: "INR",
          color: "#6366f1",
          icon: "🏦",
        },
        {
          userId,
          name: "Savings Account",
          type: "savings" as const,
          balance: "380000.00",
          currency: "INR",
          color: "#22c55e",
          icon: "🐖",
        },
        {
          userId,
          name: "HDFC Credit Card",
          type: "credit_card" as const,
          balance: "-24800.00",
          currency: "INR",
          color: "#f43f5e",
          icon: "💳",
        },
        {
          userId,
          name: "Cash Wallet",
          type: "cash" as const,
          balance: "4200.00",
          currency: "INR",
          color: "#f59e0b",
          icon: "👛",
        },
      ])
      .returning();

    const [checking, savings, creditCard, cash] = insertedAccounts;

    // ── 3. Categories ────────────────────────────────────────────────────────
    const catDefs = [
      // Income
      { name: "Salary",        type: "income"  as const, color: "#22c55e", icon: "💰", parentId: null },
      { name: "Freelance",     type: "income"  as const, color: "#10b981", icon: "💻", parentId: null },
      { name: "Investments",   type: "income"  as const, color: "#06b6d4", icon: "📈", parentId: null },
      { name: "Gifts",         type: "income"  as const, color: "#a78bfa", icon: "🎁", parentId: null },
      { name: "Rental Income", type: "income"  as const, color: "#34d399", icon: "🏠", parentId: null },
      // Expense — parents
      { name: "Food & Dining", type: "expense" as const, color: "#f97316", icon: "🍔", parentId: null },
      { name: "Transport",     type: "expense" as const, color: "#3b82f6", icon: "🚗", parentId: null },
      { name: "Housing",       type: "expense" as const, color: "#8b5cf6", icon: "🏠", parentId: null },
      { name: "Shopping",      type: "expense" as const, color: "#ec4899", icon: "🛒", parentId: null },
      { name: "Utilities",     type: "expense" as const, color: "#14b8a6", icon: "🔌", parentId: null },
      { name: "Entertainment", type: "expense" as const, color: "#f43f5e", icon: "🎮", parentId: null },
      { name: "Health",        type: "expense" as const, color: "#ef4444", icon: "🩺", parentId: null },
      { name: "Education",     type: "expense" as const, color: "#0ea5e9", icon: "🎓", parentId: null },
      { name: "Travel",        type: "expense" as const, color: "#84cc16", icon: "✈️", parentId: null },
      { name: "Personal Care", type: "expense" as const, color: "#d946ef", icon: "🧴", parentId: null },
      { name: "Groceries",     type: "expense" as const, color: "#f59e0b", icon: "🍎", parentId: null },
    ];

    const insertedCats = await db
      .insert(categoriesTable)
      .values(catDefs.map((c) => ({ ...c, userId })))
      .returning();

    // Build name→id map
    const catMap: Record<string, number> = {};
    for (const c of insertedCats) catMap[c.name] = c.id;

    // Sub-categories (children)
    const subCatDefs = [
      { name: "Restaurants",  type: "expense" as const, color: "#fb923c", icon: "🍕", parentId: catMap["Food & Dining"] },
      { name: "Coffee Shops", type: "expense" as const, color: "#a16207", icon: "☕", parentId: catMap["Food & Dining"] },
      { name: "Groceries",    type: "expense" as const, color: "#65a30d", icon: "🛍️", parentId: catMap["Food & Dining"] },
      { name: "Fuel",         type: "expense" as const, color: "#2563eb", icon: "⛽", parentId: catMap["Transport"] },
      { name: "Cab / Ride",   type: "expense" as const, color: "#1d4ed8", icon: "🚕", parentId: catMap["Transport"] },
      { name: "Rent",         type: "expense" as const, color: "#7c3aed", icon: "🏡", parentId: catMap["Housing"] },
      { name: "Maintenance",  type: "expense" as const, color: "#6d28d9", icon: "🔧", parentId: catMap["Housing"] },
      { name: "Streaming",    type: "expense" as const, color: "#dc2626", icon: "🍿", parentId: catMap["Entertainment"] },
      { name: "Gaming",       type: "expense" as const, color: "#b91c1c", icon: "🕹️", parentId: catMap["Entertainment"] },
      { name: "Clothes",      type: "expense" as const, color: "#be185d", icon: "👔", parentId: catMap["Shopping"] },
      { name: "Electronics",  type: "expense" as const, color: "#9f1239", icon: "📱", parentId: catMap["Shopping"] },
      { name: "Medicines",    type: "expense" as const, color: "#b91c1c", icon: "💊", parentId: catMap["Health"] },
      { name: "Gym",          type: "expense" as const, color: "#991b1b", icon: "🏋️", parentId: catMap["Health"] },
      { name: "Flights",      type: "expense" as const, color: "#4d7c0f", icon: "🛫", parentId: catMap["Travel"] },
      { name: "Hotels",       type: "expense" as const, color: "#3f6212", icon: "🏨", parentId: catMap["Travel"] },
    ];

    const insertedSubCats = await db
      .insert(categoriesTable)
      .values(subCatDefs.map((c) => ({ ...c, userId })))
      .returning();

    for (const c of insertedSubCats) catMap[c.name] = c.id;

    // ── 4. Transactions (154+ days, ~150 records) ────────────────────────────
    // Spread across all 4 accounts. Heavy expense variety for heatmap coverage.

    const txns: Array<{
      userId: number;
      accountId: number;
      amount: string;
      description: string;
      type: "income" | "expense";
      date: string;
      categoryId: number | null;
      notes: string | null;
    }> = [
      // ── INCOME ──────────────────────────────────────────────────────────────
      // Monthly salaries (5 months)
      { userId, accountId: checking.id, amount: "95000", description: "Monthly Salary – June",    type: "income", date: daysAgo(1),   categoryId: catMap["Salary"],        notes: "After TDS deduction" },
      { userId, accountId: checking.id, amount: "95000", description: "Monthly Salary – May",     type: "income", date: daysAgo(31),  categoryId: catMap["Salary"],        notes: null },
      { userId, accountId: checking.id, amount: "95000", description: "Monthly Salary – April",   type: "income", date: daysAgo(61),  categoryId: catMap["Salary"],        notes: null },
      { userId, accountId: checking.id, amount: "90000", description: "Monthly Salary – March",   type: "income", date: daysAgo(91),  categoryId: catMap["Salary"],        notes: null },
      { userId, accountId: checking.id, amount: "90000", description: "Monthly Salary – February",type: "income", date: daysAgo(121), categoryId: catMap["Salary"],        notes: null },
      { userId, accountId: checking.id, amount: "90000", description: "Monthly Salary – January", type: "income", date: daysAgo(151), categoryId: catMap["Salary"],        notes: null },
      // Freelance
      { userId, accountId: savings.id,  amount: "25000", description: "React Dashboard Project",  type: "income", date: daysAgo(8),   categoryId: catMap["Freelance"],     notes: "Client: TechCorp" },
      { userId, accountId: savings.id,  amount: "18000", description: "API Integration Work",     type: "income", date: daysAgo(44),  categoryId: catMap["Freelance"],     notes: null },
      { userId, accountId: savings.id,  amount: "32000", description: "Mobile App Prototype",     type: "income", date: daysAgo(78),  categoryId: catMap["Freelance"],     notes: "Client: StartupXYZ" },
      { userId, accountId: savings.id,  amount: "12000", description: "Logo & Branding Design",   type: "income", date: daysAgo(110), categoryId: catMap["Freelance"],     notes: null },
      // Investments
      { userId, accountId: savings.id,  amount: "8400",  description: "Stock Dividends – Q1",     type: "income", date: daysAgo(15),  categoryId: catMap["Investments"],   notes: "Reliance + HDFC" },
      { userId, accountId: savings.id,  amount: "6200",  description: "Mutual Fund Returns",       type: "income", date: daysAgo(55),  categoryId: catMap["Investments"],   notes: null },
      { userId, accountId: savings.id,  amount: "4800",  description: "FD Interest",               type: "income", date: daysAgo(90),  categoryId: catMap["Investments"],   notes: null },
      { userId, accountId: savings.id,  amount: "11000", description: "Crypto Profit",             type: "income", date: daysAgo(130), categoryId: catMap["Investments"],   notes: "ETH swing trade" },
      // Gifts
      { userId, accountId: cash.id,     amount: "5000",  description: "Birthday Gift from Family", type: "income", date: daysAgo(20),  categoryId: catMap["Gifts"],         notes: null },
      { userId, accountId: cash.id,     amount: "2100",  description: "Diwali Bonus",              type: "income", date: daysAgo(140), categoryId: catMap["Gifts"],         notes: null },
      // Rental
      { userId, accountId: checking.id, amount: "18000", description: "Tenant Rent – June",       type: "income", date: daysAgo(3),   categoryId: catMap["Rental Income"], notes: "2BHK Flat" },
      { userId, accountId: checking.id, amount: "18000", description: "Tenant Rent – May",        type: "income", date: daysAgo(33),  categoryId: catMap["Rental Income"], notes: null },
      { userId, accountId: checking.id, amount: "18000", description: "Tenant Rent – April",      type: "income", date: daysAgo(63),  categoryId: catMap["Rental Income"], notes: null },
      { userId, accountId: checking.id, amount: "18000", description: "Tenant Rent – March",      type: "income", date: daysAgo(93),  categoryId: catMap["Rental Income"], notes: null },

      // ── EXPENSES ─────────────────────────────────────────────────────────────
      // Housing / Rent
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – June",        type: "expense", date: daysAgo(2),   categoryId: catMap["Rent"],          notes: "3BHK Koramangala" },
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – May",         type: "expense", date: daysAgo(32),  categoryId: catMap["Rent"],          notes: null },
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – April",       type: "expense", date: daysAgo(62),  categoryId: catMap["Rent"],          notes: null },
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – March",       type: "expense", date: daysAgo(92),  categoryId: catMap["Rent"],          notes: null },
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – February",    type: "expense", date: daysAgo(122), categoryId: catMap["Rent"],          notes: null },
      { userId, accountId: checking.id, amount: "22000", description: "House Rent – January",     type: "expense", date: daysAgo(152), categoryId: catMap["Rent"],          notes: null },
      { userId, accountId: checking.id, amount: "2400",  description: "Plumber / Maintenance",    type: "expense", date: daysAgo(45),  categoryId: catMap["Maintenance"],   notes: null },
      { userId, accountId: checking.id, amount: "1800",  description: "Society Maintenance",      type: "expense", date: daysAgo(75),  categoryId: catMap["Maintenance"],   notes: null },

      // Food & Dining – frequent & spread out
      { userId, accountId: creditCard.id, amount: "2800",  description: "Barbeque Nation Dinner",   type: "expense", date: daysAgo(4),   categoryId: catMap["Restaurants"],   notes: "Family dinner" },
      { userId, accountId: creditCard.id, amount: "650",   description: "Café Coffee Day",           type: "expense", date: daysAgo(5),   categoryId: catMap["Coffee Shops"],  notes: null },
      { userId, accountId: creditCard.id, amount: "4200",  description: "Swiggy Orders – Week",      type: "expense", date: daysAgo(7),   categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: creditCard.id, amount: "3100",  description: "Zomato – Biryani Fest",     type: "expense", date: daysAgo(11),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: cash.id,       amount: "480",   description: "Street Food – MG Road",     type: "expense", date: daysAgo(13),  categoryId: catMap["Food & Dining"], notes: null },
      { userId, accountId: creditCard.id, amount: "5800",  description: "Birthday Party Dinner",     type: "expense", date: daysAgo(18),  categoryId: catMap["Restaurants"],   notes: "12 people" },
      { userId, accountId: checking.id,   amount: "3600",  description: "Big Basket Grocery",        type: "expense", date: daysAgo(21),  categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: checking.id,   amount: "2900",  description: "Reliance Fresh – Monthly",  type: "expense", date: daysAgo(22),  categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: creditCard.id, amount: "720",   description: "Starbucks",                 type: "expense", date: daysAgo(24),  categoryId: catMap["Coffee Shops"],  notes: null },
      { userId, accountId: creditCard.id, amount: "1900",  description: "KFC & Dominos",             type: "expense", date: daysAgo(26),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: creditCard.id, amount: "3400",  description: "Swiggy Orders – Week",      type: "expense", date: daysAgo(36),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: checking.id,   amount: "3200",  description: "Grocery Shopping",          type: "expense", date: daysAgo(38),  categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: creditCard.id, amount: "2100",  description: "Restaurant – Taj Vivanta",  type: "expense", date: daysAgo(50),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: cash.id,       amount: "350",   description: "Tea & Snacks",              type: "expense", date: daysAgo(53),  categoryId: catMap["Coffee Shops"],  notes: null },
      { userId, accountId: creditCard.id, amount: "4100",  description: "Zomato – Weekend Binge",    type: "expense", date: daysAgo(65),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: checking.id,   amount: "3500",  description: "Grocery – Month End",       type: "expense", date: daysAgo(68),  categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: creditCard.id, amount: "890",   description: "Blue Tokai Coffee",         type: "expense", date: daysAgo(72),  categoryId: catMap["Coffee Shops"],  notes: null },
      { userId, accountId: creditCard.id, amount: "3200",  description: "Swiggy – Weekly",           type: "expense", date: daysAgo(80),  categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: checking.id,   amount: "2800",  description: "D-Mart Grocery",            type: "expense", date: daysAgo(98),  categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: creditCard.id, amount: "6200",  description: "Family Restaurant Dinner",  type: "expense", date: daysAgo(105), categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: creditCard.id, amount: "3100",  description: "Zomato – Monthly",          type: "expense", date: daysAgo(115), categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: checking.id,   amount: "3400",  description: "Grocery Shopping",          type: "expense", date: daysAgo(128), categoryId: catMap["Groceries"],     notes: null },
      { userId, accountId: creditCard.id, amount: "2600",  description: "Swiggy – Week",             type: "expense", date: daysAgo(135), categoryId: catMap["Restaurants"],   notes: null },
      { userId, accountId: creditCard.id, amount: "4800",  description: "Office Lunch Party",        type: "expense", date: daysAgo(143), categoryId: catMap["Restaurants"],   notes: "15 colleagues" },
      { userId, accountId: checking.id,   amount: "3200",  description: "Grocery Shopping",          type: "expense", date: daysAgo(148), categoryId: catMap["Groceries"],     notes: null },

      // Transport
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol – Indigo",           type: "expense", date: daysAgo(6),   categoryId: catMap["Fuel"],          notes: null },
      { userId, accountId: cash.id,     amount: "520",   description: "Ola – Airport Drop",        type: "expense", date: daysAgo(9),   categoryId: catMap["Cab / Ride"],    notes: null },
      { userId, accountId: cash.id,     amount: "380",   description: "Rapido – Office Commute",   type: "expense", date: daysAgo(12),  categoryId: catMap["Cab / Ride"],    notes: null },
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol – Monthly Fill",     type: "expense", date: daysAgo(36),  categoryId: catMap["Fuel"],          notes: null },
      { userId, accountId: cash.id,     amount: "290",   description: "Auto – Market",             type: "expense", date: daysAgo(40),  categoryId: catMap["Cab / Ride"],    notes: null },
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol",                    type: "expense", date: daysAgo(66),  categoryId: catMap["Fuel"],          notes: null },
      { userId, accountId: cash.id,     amount: "650",   description: "Uber – Late Night",         type: "expense", date: daysAgo(71),  categoryId: catMap["Cab / Ride"],    notes: null },
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol",                    type: "expense", date: daysAgo(96),  categoryId: catMap["Fuel"],          notes: null },
      { userId, accountId: creditCard.id, amount: "1200","description": "Car Service",             type: "expense", date: daysAgo(100), categoryId: catMap["Maintenance"],   notes: "Oil change" },
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol",                    type: "expense", date: daysAgo(126), categoryId: catMap["Fuel"],          notes: null },
      { userId, accountId: checking.id, amount: "4800",  description: "Petrol",                    type: "expense", date: daysAgo(153), categoryId: catMap["Fuel"],          notes: null },

      // Shopping
      { userId, accountId: creditCard.id, amount: "3200",  description: "H&M – Summer Haul",        type: "expense", date: daysAgo(14),  categoryId: catMap["Clothes"],       notes: null },
      { userId, accountId: creditCard.id, amount: "12500", description: "OnePlus Nord CE 4",         type: "expense", date: daysAgo(22),  categoryId: catMap["Electronics"],   notes: "Flash sale" },
      { userId, accountId: creditCard.id, amount: "4800",  description: "Zara – Formal Wear",        type: "expense", date: daysAgo(55),  categoryId: catMap["Clothes"],       notes: null },
      { userId, accountId: creditCard.id, amount: "6200",  description: "Amazon – Gadgets",          type: "expense", date: daysAgo(88),  categoryId: catMap["Electronics"],   notes: "Keyboard + Mouse" },
      { userId, accountId: creditCard.id, amount: "2100",  description: "Myntra – Casuals",          type: "expense", date: daysAgo(119), categoryId: catMap["Clothes"],       notes: null },
      { userId, accountId: creditCard.id, amount: "9800",  description: "Boat Airdopes 141",         type: "expense", date: daysAgo(145), categoryId: catMap["Electronics"],   notes: null },

      // Utilities
      { userId, accountId: checking.id, amount: "2800",  description: "Electricity Bill – BESCOM",  type: "expense", date: daysAgo(10),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "800",   description: "Jio Fiber – Broadband",      type: "expense", date: daysAgo(11),  categoryId: catMap["Utilities"],     notes: "1 Gbps Plan" },
      { userId, accountId: checking.id, amount: "2600",  description: "Electricity Bill",            type: "expense", date: daysAgo(40),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "800",   description: "Internet Bill",               type: "expense", date: daysAgo(41),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "2900",  description: "Electricity Bill",            type: "expense", date: daysAgo(70),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "800",   description: "Jio Fiber",                   type: "expense", date: daysAgo(71),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "380",   description: "Water Bill",                  type: "expense", date: daysAgo(72),  categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "2700",  description: "Electricity Bill",            type: "expense", date: daysAgo(100), categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "800",   description: "Internet Bill",               type: "expense", date: daysAgo(101), categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "2500",  description: "Electricity Bill",            type: "expense", date: daysAgo(130), categoryId: catMap["Utilities"],     notes: null },
      { userId, accountId: checking.id, amount: "800",   description: "Internet Bill",               type: "expense", date: daysAgo(131), categoryId: catMap["Utilities"],     notes: null },

      // Entertainment
      { userId, accountId: creditCard.id, amount: "649",   description: "Netflix – Premium",         type: "expense", date: daysAgo(16),  categoryId: catMap["Streaming"],     notes: null },
      { userId, accountId: creditCard.id, amount: "119",   description: "Spotify Premium",           type: "expense", date: daysAgo(16),  categoryId: catMap["Streaming"],     notes: null },
      { userId, accountId: creditCard.id, amount: "2199",  description: "Steam – Games Bundle",      type: "expense", date: daysAgo(19),  categoryId: catMap["Gaming"],        notes: "Summer sale" },
      { userId, accountId: creditCard.id, amount: "1599",  description: "PS5 Game – FIFA 25",        type: "expense", date: daysAgo(60),  categoryId: catMap["Gaming"],        notes: null },
      { userId, accountId: creditCard.id, amount: "649",   description: "Netflix – Monthly",         type: "expense", date: daysAgo(46),  categoryId: catMap["Streaming"],     notes: null },
      { userId, accountId: creditCard.id, amount: "849",   description: "Amazon Prime Annual Promo", type: "expense", date: daysAgo(90),  categoryId: catMap["Streaming"],     notes: null },
      { userId, accountId: cash.id,       amount: "450",   description: "PVR Cinema – Kalki 2898",   type: "expense", date: daysAgo(25),  categoryId: catMap["Entertainment"], notes: null },
      { userId, accountId: cash.id,       amount: "780",   description: "Bowling Night",             type: "expense", date: daysAgo(48),  categoryId: catMap["Entertainment"], notes: null },

      // Health
      { userId, accountId: checking.id, amount: "1200",  description: "Cult.fit Gym – Monthly",     type: "expense", date: daysAgo(2),   categoryId: catMap["Gym"],           notes: null },
      { userId, accountId: checking.id, amount: "1200",  description: "Cult.fit Gym – Monthly",     type: "expense", date: daysAgo(32),  categoryId: catMap["Gym"],           notes: null },
      { userId, accountId: checking.id, amount: "1200",  description: "Cult.fit Gym – Monthly",     type: "expense", date: daysAgo(62),  categoryId: catMap["Gym"],           notes: null },
      { userId, accountId: checking.id, amount: "1200",  description: "Cult.fit Gym – Monthly",     type: "expense", date: daysAgo(92),  categoryId: catMap["Gym"],           notes: null },
      { userId, accountId: creditCard.id, amount: "2200", description: "Doctor Consultation",        type: "expense", date: daysAgo(28),  categoryId: catMap["Health"],        notes: "Specialist visit" },
      { userId, accountId: creditCard.id, amount: "1650", description: "Pharmacy – Medicines",       type: "expense", date: daysAgo(29),  categoryId: catMap["Medicines"],     notes: null },
      { userId, accountId: creditCard.id, amount: "4800", description: "Health Checkup Package",     type: "expense", date: daysAgo(110), categoryId: catMap["Health"],        notes: "Full body" },
      { userId, accountId: creditCard.id, amount: "890",  description: "Pharmacy",                   type: "expense", date: daysAgo(120), categoryId: catMap["Medicines"],     notes: null },

      // Education
      { userId, accountId: creditCard.id, amount: "4999",  description: "Udemy – React + TS Course", type: "expense", date: daysAgo(30),  categoryId: catMap["Education"],     notes: null },
      { userId, accountId: creditCard.id, amount: "2500",  description: "Coursera – Machine Learning",type: "expense", date: daysAgo(95),  categoryId: catMap["Education"],     notes: "Month subscription" },
      { userId, accountId: creditCard.id, amount: "1299",  description: "O'Reilly Books",             type: "expense", date: daysAgo(135), categoryId: catMap["Education"],     notes: null },

      // Travel
      { userId, accountId: creditCard.id, amount: "14500", description: "Goa Flights – Round Trip",  type: "expense", date: daysAgo(35),  categoryId: catMap["Flights"],       notes: "IndiGo" },
      { userId, accountId: creditCard.id, amount: "8200",  description: "Goa Hotel – 3 nights",      type: "expense", date: daysAgo(34),  categoryId: catMap["Hotels"],        notes: "The Leela" },
      { userId, accountId: cash.id,       amount: "3400",  description: "Goa – Activities & Food",   type: "expense", date: daysAgo(33),  categoryId: catMap["Travel"],        notes: null },
      { userId, accountId: creditCard.id, amount: "22000", description: "Manali Trip – Flights",     type: "expense", date: daysAgo(88),  categoryId: catMap["Flights"],       notes: "Air India" },
      { userId, accountId: creditCard.id, amount: "12000", description: "Manali – Hotel 4N",         type: "expense", date: daysAgo(87),  categoryId: catMap["Hotels"],        notes: null },
      { userId, accountId: cash.id,       amount: "5600",  description: "Manali – Local Transport",  type: "expense", date: daysAgo(86),  categoryId: catMap["Travel"],        notes: null },

      // Personal Care
      { userId, accountId: cash.id,       amount: "800",  description: "Haircut – Enrich Salon",     type: "expense", date: daysAgo(17),  categoryId: catMap["Personal Care"], notes: null },
      { userId, accountId: creditCard.id, amount: "2400", description: "Nykaa – Skincare Products",  type: "expense", date: daysAgo(52),  categoryId: catMap["Personal Care"], notes: null },
      { userId, accountId: cash.id,       amount: "600",  description: "Haircut",                    type: "expense", date: daysAgo(77),  categoryId: catMap["Personal Care"], notes: null },
      { userId, accountId: creditCard.id, amount: "1800", description: "Spa Treatment",              type: "expense", date: daysAgo(108), categoryId: catMap["Personal Care"], notes: null },
      { userId, accountId: cash.id,       amount: "700",  description: "Haircut & Beard",            type: "expense", date: daysAgo(137), categoryId: catMap["Personal Care"], notes: null },
    ];

    await db.insert(transactionsTable).values(txns);

    // ── 5. Subscriptions ──────────────────────────────────────────────────────
    await db.insert(subscriptionsTable).values([
      {
        userId,
        name: "Netflix Premium",
        amount: "649",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(14),
        accountId: creditCard.id,
        categoryId: catMap["Streaming"],
        isActive: true,
        notes: "UHD plan – 4 screens",
      },
      {
        userId,
        name: "Spotify Premium",
        amount: "119",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(14),
        accountId: creditCard.id,
        categoryId: catMap["Streaming"],
        isActive: true,
        notes: null,
      },
      {
        userId,
        name: "Amazon Prime",
        amount: "1499",
        type: "expense" as const,
        interval: "yearly",
        nextDueDate: daysFromNow(275),
        accountId: creditCard.id,
        categoryId: catMap["Streaming"],
        isActive: true,
        notes: "Annual plan",
      },
      {
        userId,
        name: "YouTube Premium",
        amount: "189",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(7),
        accountId: creditCard.id,
        categoryId: catMap["Streaming"],
        isActive: true,
        notes: null,
      },
      {
        userId,
        name: "Cult.fit Gym",
        amount: "1200",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(28),
        accountId: checking.id,
        categoryId: catMap["Gym"],
        isActive: true,
        notes: "Elite Plan",
      },
      {
        userId,
        name: "Jio Fiber Broadband",
        amount: "800",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(19),
        accountId: checking.id,
        categoryId: catMap["Utilities"],
        isActive: true,
        notes: "1 Gbps Unlimited",
      },
      {
        userId,
        name: "Jio Mobile Recharge",
        amount: "249",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(5),
        accountId: cash.id,
        categoryId: catMap["Utilities"],
        isActive: true,
        notes: "Unlimited calls + 2GB/day",
      },
      {
        userId,
        name: "Udemy Subscription",
        amount: "850",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(22),
        accountId: creditCard.id,
        categoryId: catMap["Education"],
        isActive: false,
        notes: "Paused – resume next month",
      },
      {
        userId,
        name: "GitHub Copilot",
        amount: "1000",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(3),
        accountId: creditCard.id,
        categoryId: catMap["Education"],
        isActive: true,
        notes: "Pro plan",
      },
      {
        userId,
        name: "Antivirus – Norton",
        amount: "1299",
        type: "expense" as const,
        interval: "yearly",
        nextDueDate: daysFromNow(182),
        accountId: creditCard.id,
        categoryId: catMap["Utilities"],
        isActive: true,
        notes: "5 devices",
      },
      {
        userId,
        name: "Society Maintenance",
        amount: "1800",
        type: "expense" as const,
        interval: "monthly",
        nextDueDate: daysFromNow(20),
        accountId: checking.id,
        categoryId: catMap["Maintenance"],
        isActive: true,
        notes: null,
      },
      {
        userId,
        name: "Weekly Vegetable Box",
        amount: "550",
        type: "expense" as const,
        interval: "weekly",
        nextDueDate: daysFromNow(2),
        accountId: cash.id,
        categoryId: catMap["Groceries"],
        isActive: true,
        notes: "Organic farm delivery",
      },
    ]);

    res.status(201).json({
      message: "Demo data loaded successfully! 🎉",
      seeded: {
        accounts: insertedAccounts.length,
        categories: insertedCats.length + insertedSubCats.length,
        transactions: txns.length,
        subscriptions: 12,
      },
    });
  } catch (err) {
    console.error("Demo data error:", err);
    res.status(500).json({ error: "Failed to load demo data", detail: String(err) });
  }
});

export default router;

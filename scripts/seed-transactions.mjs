#!/usr/bin/env node
// Seed script — adds categories + 50 sample transactions
// Uses your existing accounts: HDFC BANK (4), CASH (5), HDFC FREEDOM (6)

const BASE = "http://localhost:8080/api";

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`POST ${path} → ${r.status}: ${t}`);
  }
  return r.json();
}

// ── Categories ───────────────────────────────────────────────
const categories = [
  { name: "Food & Dining",    type: "expense", color: "#fb923c" },
  { name: "Groceries",        type: "expense", color: "#a3e635" },
  { name: "Transport",        type: "expense", color: "#b51a00" },  // exists — skip
  { name: "Shopping",         type: "expense", color: "#60a5fa" },
  { name: "Entertainment",    type: "expense", color: "#c084fc" },
  { name: "Utilities",        type: "expense", color: "#34d399" },
  { name: "Health",           type: "expense", color: "#f87171" },
  { name: "Subscriptions",    type: "expense", color: "#f472b6" },  // exists — skip
  { name: "Salary",           type: "income",  color: "#4ade80" },
  { name: "Freelance",        type: "income",  color: "#22d3ee" },
];

// existing category ids (will be filled after create)
const catMap = {
  "Transport": 1,       // already exists
  "Subscriptions": 2,   // already exists
};

async function seedCategories() {
  const toCreate = categories.filter(c => !catMap[c.name]);
  for (const cat of toCreate) {
    const created = await post("/categories", cat);
    catMap[cat.name] = created.id;
    console.log(`  ✓ Category: ${cat.name} (id=${created.id})`);
  }
}

// ── Transactions ─────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const ACC_HDFC  = 4;
const ACC_CASH  = 5;
const ACC_CC    = 6;

// 50 realistic Indian transactions
const TXN_TEMPLATES = [
  // Food & Dining
  { description: "Zomato order — Biryani", amount: 349, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 2  },
  { description: "Swiggy — Butter Chicken",amount: 280, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 5  },
  { description: "McDonald's",             amount: 420, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 9  },
  { description: "Café Coffee Day",        amount: 180, type: "expense", cat: "Food & Dining", acc: ACC_CASH, day: 12 },
  { description: "Zomato — Pizza",         amount: 399, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 18 },
  { description: "Lunch at office canteen",amount: 90,  type: "expense", cat: "Food & Dining", acc: ACC_CASH, day: 22 },
  { description: "Domino's Pizza",         amount: 560, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 28 },
  { description: "Chai & snacks",          amount: 50,  type: "expense", cat: "Food & Dining", acc: ACC_CASH, day: 33 },
  { description: "KFC Family Meal",        amount: 780, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 37 },
  { description: "Swiggy — Thali",         amount: 210, type: "expense", cat: "Food & Dining", acc: ACC_CC,   day: 44 },

  // Groceries
  { description: "BigBasket monthly order",amount: 2340,type: "expense", cat: "Groceries",   acc: ACC_HDFC,  day: 3  },
  { description: "D-Mart vegetables",      amount: 680, type: "expense", cat: "Groceries",   acc: ACC_CASH,  day: 14 },
  { description: "Milk & bread",           amount: 120, type: "expense", cat: "Groceries",   acc: ACC_CASH,  day: 20 },
  { description: "Blinkit groceries",      amount: 950, type: "expense", cat: "Groceries",   acc: ACC_HDFC,  day: 35 },
  { description: "Zepto — eggs & snacks",  amount: 340, type: "expense", cat: "Groceries",   acc: ACC_HDFC,  day: 48 },

  // Transport
  { description: "Ola cab to airport",     amount: 650, type: "expense", cat: "Transport",   acc: ACC_HDFC,  day: 1  },
  { description: "Rapido bike ride",       amount: 80,  type: "expense", cat: "Transport",   acc: ACC_CASH,  day: 6  },
  { description: "Metro recharge",         amount: 200, type: "expense", cat: "Transport",   acc: ACC_HDFC,  day: 10 },
  { description: "Uber — office commute",  amount: 140, type: "expense", cat: "Transport",   acc: ACC_HDFC,  day: 15 },
  { description: "Petrol — Hero Splendor", amount: 450, type: "expense", cat: "Transport",   acc: ACC_CASH,  day: 25 },
  { description: "Ola — night out",        amount: 320, type: "expense", cat: "Transport",   acc: ACC_HDFC,  day: 40 },
  { description: "Bus pass monthly",       amount: 500, type: "expense", cat: "Transport",   acc: ACC_HDFC,  day: 50 },

  // Shopping
  { description: "Amazon — Headphones",    amount: 1499,type: "expense", cat: "Shopping",    acc: ACC_CC,    day: 4  },
  { description: "Myntra — Shirt",         amount: 899, type: "expense", cat: "Shopping",    acc: ACC_CC,    day: 16 },
  { description: "Flipkart — Phone case",  amount: 249, type: "expense", cat: "Shopping",    acc: ACC_CC,    day: 21 },
  { description: "Nykaa — Skincare kit",   amount: 1200,type: "expense", cat: "Shopping",    acc: ACC_CC,    day: 30 },
  { description: "Amazon — Books",         amount: 680, type: "expense", cat: "Shopping",    acc: ACC_HDFC,  day: 42 },
  { description: "Decathlon — water bottle",amount:350, type: "expense", cat: "Shopping",    acc: ACC_HDFC,  day: 55 },

  // Entertainment
  { description: "PVR — Kalki 2898 AD",    amount: 450, type: "expense", cat: "Entertainment",acc: ACC_CC,  day: 7  },
  { description: "Laughter club show",     amount: 600, type: "expense", cat: "Entertainment",acc: ACC_CASH, day: 19 },
  { description: "BookMyShow — concert",   amount: 1200,type: "expense", cat: "Entertainment",acc: ACC_CC,  day: 32 },
  { description: "INOX weekend movie",     amount: 380, type: "expense", cat: "Entertainment",acc: ACC_CC,  day: 46 },

  // Utilities
  { description: "Airtel broadband bill",  amount: 799, type: "expense", cat: "Utilities",   acc: ACC_HDFC,  day: 8  },
  { description: "BESCOM electricity bill",amount: 1240,type: "expense", cat: "Utilities",   acc: ACC_HDFC,  day: 11 },
  { description: "Jio recharge",          amount: 299, type: "expense", cat: "Utilities",   acc: ACC_HDFC,  day: 26 },
  { description: "Gas cylinder refill",    amount: 920, type: "expense", cat: "Utilities",   acc: ACC_CASH,  day: 38 },

  // Health
  { description: "Apollo pharmacy",        amount: 560, type: "expense", cat: "Health",      acc: ACC_HDFC,  day: 13 },
  { description: "Gym monthly membership", amount: 1500,type: "expense", cat: "Health",      acc: ACC_HDFC,  day: 31 },
  { description: "Doctor consultation",    amount: 500, type: "expense", cat: "Health",      acc: ACC_CASH,  day: 43 },
  { description: "Practo — diagnostics",   amount: 850, type: "expense", cat: "Health",      acc: ACC_HDFC,  day: 52 },

  // Subscriptions
  { description: "Netflix monthly",        amount: 649, type: "expense", cat: "Subscriptions",acc: ACC_CC,   day: 17 },
  { description: "Spotify Premium",        amount: 119, type: "expense", cat: "Subscriptions",acc: ACC_CC,   day: 17 },
  { description: "Amazon Prime",           amount: 299, type: "expense", cat: "Subscriptions",acc: ACC_CC,   day: 36 },
  { description: "YouTube Premium",        amount: 189, type: "expense", cat: "Subscriptions",acc: ACC_CC,   day: 36 },

  // Income
  { description: "Monthly salary credit",  amount: 75000,type:"income",  cat: "Salary",      acc: ACC_HDFC,  day: 29 },
  { description: "Freelance project payment",amount:12000,type:"income", cat: "Freelance",   acc: ACC_HDFC,  day: 23 },
  { description: "Referral bonus",         amount: 500, type: "income",  cat: "Freelance",   acc: ACC_HDFC,  day: 45 },
  { description: "Side gig payment",       amount: 3500,type: "income",  cat: "Freelance",   acc: ACC_HDFC,  day: 54 },
  { description: "Cashback credit",        amount: 180, type: "income",  cat: "Freelance",   acc: ACC_HDFC,  day: 56 },
];

async function seedTransactions() {
  let i = 0;
  for (const t of TXN_TEMPLATES) {
    const body = {
      amount: t.amount,
      description: t.description,
      type: t.type,
      date: daysAgo(t.day),
      accountId: t.acc,
      categoryId: catMap[t.cat] ?? null,
    };
    const created = await post("/transactions", body);
    i++;
    console.log(`  ✓ [${i}/50] ${t.type === "income" ? "↑" : "↓"} ₹${t.amount} — ${t.description}`);
  }
}

(async () => {
  console.log("\n── Seeding categories…");
  await seedCategories();

  console.log("\n── Seeding 50 transactions…");
  await seedTransactions();

  console.log("\n✅ Done! Refresh the app to see your data.\n");
})().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });

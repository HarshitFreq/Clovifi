import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { accountsTable, categoriesTable, transactionsTable, usersTable } from "../lib/db/src/schema/index.js";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost/aerofinance";

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function run() {
  console.log("Connecting to Database...");
  
  // Find User 1 (alice)
  const [alice] = await db.select().from(usersTable).where(eq(usersTable.id, 1));
  if (!alice) {
    console.error("User with ID 1 (alice) not found!");
    process.exit(1);
  }
  console.log(`Found user: ${alice.username} (ID: ${alice.id})`);

  // Define and Seed Accounts for Alice
  const accountsToCreate = [
    { name: "HDFC Savings Account", type: "savings", balance: "78000.50", currency: "INR", color: "#2563eb", icon: "wallet" },
    { name: "SBI Cash Wallet", type: "cash", balance: "4200.00", currency: "INR", color: "#16a34a", icon: "banknote" },
    { name: "ICICI Amazon Pay CC", type: "credit_card", balance: "-12450.00", currency: "INR", color: "#ea580c", icon: "credit-card" }
  ];

  const createdAccounts = [];
  for (const acc of accountsToCreate) {
    const [inserted] = await db.insert(accountsTable).values({
      userId: alice.id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      color: acc.color,
      icon: acc.icon
    }).returning();
    createdAccounts.push(inserted);
    console.log(`Created Account: ${inserted.name} (ID: ${inserted.id})`);
  }

  // Define and Seed Categories for Alice
  const categoriesToCreate = [
    { name: "Food & Canteens", type: "expense", color: "#f97316" },
    { name: "Groceries & Marts", type: "expense", color: "#84cc16" },
    { name: "Cabs & Fuel", type: "expense", color: "#ef4444" },
    { name: "Online Shopping", type: "expense", color: "#3b82f6" },
    { name: "Movies & Events", type: "expense", color: "#a855f7" },
    { name: "Broadband & Recharge", type: "expense", color: "#10b981" },
    { name: "Gym & Health", type: "expense", color: "#ec4899" },
    { name: "SaaS Subscriptions", type: "expense", color: "#f43f5e" },
    { name: "Salary Income", type: "income", color: "#22c55e" },
    { name: "Freelance Gig", type: "income", color: "#06b6d4" }
  ];

  const createdCategories = [];
  for (const cat of categoriesToCreate) {
    const [inserted] = await db.insert(categoriesTable).values({
      userId: alice.id,
      name: cat.name,
      type: cat.type,
      color: cat.color
    }).returning();
    createdCategories.push(inserted);
    console.log(`Created Category: ${inserted.name} (ID: ${inserted.id})`);
  }

  // Templates for transactions
  const foodTemplates = [
    { desc: "Zomato lunch order", min: 150, max: 600, type: "expense", catName: "Food & Canteens" },
    { desc: "Swiggy dinner order", min: 200, max: 800, type: "expense", catName: "Food & Canteens" },
    { desc: "Starbucks Coffee", min: 250, max: 450, type: "expense", catName: "Food & Canteens" },
    { desc: "Chai Point snacks", min: 60, max: 200, type: "expense", catName: "Food & Canteens" },
    { desc: "McDonald's burger meal", min: 180, max: 500, type: "expense", catName: "Food & Canteens" }
  ];

  const groceryTemplates = [
    { desc: "Blinkit items", min: 200, max: 1200, type: "expense", catName: "Groceries & Marts" },
    { desc: "Zepto delivery", min: 150, max: 800, type: "expense", catName: "Groceries & Marts" },
    { desc: "D-Mart superstore", min: 1000, max: 5000, type: "expense", catName: "Groceries & Marts" },
    { desc: "Local vendor milk/eggs", min: 50, max: 300, type: "expense", catName: "Groceries & Marts" }
  ];

  const transportTemplates = [
    { desc: "Ola Cab ride", min: 250, max: 750, type: "expense", catName: "Cabs & Fuel" },
    { desc: "Uber auto commute", min: 80, max: 220, type: "expense", catName: "Cabs & Fuel" },
    { desc: "Petrol fill up", min: 500, max: 2000, type: "expense", catName: "Cabs & Fuel" },
    { desc: "Metro smartcard recharge", min: 100, max: 500, type: "expense", catName: "Cabs & Fuel" }
  ];

  const shoppingTemplates = [
    { desc: "Amazon online order", min: 300, max: 4000, type: "expense", catName: "Online Shopping" },
    { desc: "Myntra clothes", min: 600, max: 3500, type: "expense", catName: "Online Shopping" },
    { desc: "Decathlon gear", min: 400, max: 2500, type: "expense", catName: "Online Shopping" }
  ];

  const entertainmentTemplates = [
    { desc: "BookMyShow movie tickets", min: 300, max: 1000, type: "expense", catName: "Movies & Events" },
    { desc: "Standup comedy show", min: 500, max: 1500, type: "expense", catName: "Movies & Events" },
    { desc: "Bowling with friends", min: 400, max: 1200, type: "expense", catName: "Movies & Events" }
  ];

  const utilitiesTemplates = [
    { desc: "Airtel Fiber wifi", min: 799, max: 1199, type: "expense", catName: "Broadband & Recharge" },
    { desc: "BESCOM Power", min: 800, max: 2500, type: "expense", catName: "Broadband & Recharge" },
    { desc: "Jio SIM recharge", min: 299, max: 749, type: "expense", catName: "Broadband & Recharge" }
  ];

  const healthTemplates = [
    { desc: "Apollo Pharmacy medicines", min: 100, max: 1500, type: "expense", catName: "Gym & Health" },
    { desc: "Cult.fit membership renewal", min: 1500, max: 3000, type: "expense", catName: "Gym & Health" },
    { desc: "Dentist visit checkup", min: 500, max: 1200, type: "expense", catName: "Gym & Health" }
  ];

  const subscriptionTemplates = [
    { desc: "Netflix Standard HD", min: 499, max: 499, type: "expense", catName: "SaaS Subscriptions" },
    { desc: "Spotify Premium Duo", min: 149, max: 149, type: "expense", catName: "SaaS Subscriptions" },
    { desc: "YouTube Premium family", min: 189, max: 189, type: "expense", catName: "SaaS Subscriptions" },
    { desc: "Claude Pro subscription", min: 1999, max: 1999, type: "expense", catName: "SaaS Subscriptions" }
  ];

  const allExpenseTemplates = [
    ...foodTemplates,
    ...groceryTemplates,
    ...transportTemplates,
    ...shoppingTemplates,
    ...entertainmentTemplates,
    ...utilitiesTemplates,
    ...healthTemplates,
    ...subscriptionTemplates
  ];

  console.log("Generating 350 transactions over the last 90 days...");
  const txns = [];

  // Add Salaries (3 salaries, one per month)
  const salaryCat = createdCategories.find(c => c.name === "Salary Income");
  const hdfcAcc = createdAccounts.find(a => a.name === "HDFC Savings Account");
  const sbiAcc = createdAccounts.find(a => a.name === "SBI Cash Wallet");
  const iciciAcc = createdAccounts.find(a => a.name === "ICICI Amazon Pay CC");

  for (let m = 0; m < 3; m++) {
    const date = new Date();
    date.setDate(1 - m * 30); // 1st of each month
    txns.push({
      userId: alice.id,
      amount: "85000.00",
      description: "Monthly Tech Salary Credited",
      type: "income",
      date: date.toISOString().split("T")[0],
      accountId: hdfcAcc.id,
      categoryId: salaryCat.id
    });
  }

  // Add Freelance gigs (approx 5-6 income transactions)
  const gigCat = createdCategories.find(c => c.name === "Freelance Gig");
  for (let g = 0; g < 6; g++) {
    const date = new Date();
    date.setDate(Math.floor(Math.random() * 80) + 5);
    const amount = (Math.floor(Math.random() * 4) + 2) * 5000; // 10000 - 25000
    txns.push({
      userId: alice.id,
      amount: amount.toFixed(2),
      description: "Freelance Website Frontend delivery",
      type: "income",
      date: date.toISOString().split("T")[0],
      accountId: hdfcAcc.id,
      categoryId: gigCat.id
    });
  }

  // Add 340 expense transactions scattered across the last 90 days
  for (let i = 0; i < 340; i++) {
    const temp = allExpenseTemplates[Math.floor(Math.random() * allExpenseTemplates.length)];
    const cat = createdCategories.find(c => c.name === temp.catName);
    
    // Pick account
    let acc = sbiAcc; // Cash for small amounts
    const amountVal = Math.floor(Math.random() * (temp.max - temp.min + 1)) + temp.min;
    if (amountVal > 1500) {
      acc = hdfcAcc; // HDFC for high values
    } else if (Math.random() > 0.5) {
      acc = iciciAcc; // Credit card for mid value transactions
    }

    const date = new Date();
    // Scatter randomly across last 90 days
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    txns.push({
      userId: alice.id,
      amount: amountVal.toFixed(2),
      description: temp.desc,
      type: "expense",
      date: date.toISOString().split("T")[0],
      accountId: acc.id,
      categoryId: cat ? cat.id : null
    });
  }

  // Insert all in batches to avoid query size limits
  console.log(`Inserting ${txns.length} transactions in database...`);
  const batchSize = 50;
  for (let i = 0; i < txns.length; i += batchSize) {
    const batch = txns.slice(i, i + batchSize);
    await db.insert(transactionsTable).values(batch);
  }

  console.log("Successfully seeded 350+ transactions!");
  await pool.end();
}

run().catch(err => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});

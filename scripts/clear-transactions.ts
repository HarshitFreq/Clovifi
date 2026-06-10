import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { transactionsTable } from "../lib/db/src/schema/index.ts";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost/aerofinance";
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function run() {
  console.log("Connecting to database and clearing all transactions...");
  const deleted = await db.delete(transactionsTable).returning();
  console.log(`Successfully deleted ${deleted.length} transaction records!`);
  await pool.end();
}

run().catch(err => {
  console.error("Failed to clear transactions:", err);
  process.exit(1);
});

// Inserts preview transactions for May 2026 so the dashboard chart is visible.
// Run with: npx tsx scripts/seed-preview-may2026.ts --confirm
// Safe to re-run — uses INSERT OR IGNORE on a description uniqueness check via existing rows.
// Delete with: DELETE FROM transactions WHERE month=5 AND year=2026 AND description LIKE '[preview]%'

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const CONFIRM = process.argv.includes("--confirm");
if (!CONFIRM) {
  console.log("Dry run — pass --confirm to actually insert.");
  console.log("Run: npx tsx scripts/seed-preview-may2026.ts --confirm");
  process.exit(0);
}

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Preview transactions derived from app/preview/page.tsx mockTransactions.
// Only expense transactions — income doesn't appear in the chart.
const ROWS: { slug: string; description: string; amount: number; date: string }[] = [
  { slug: "rent-mortgage",   description: "[preview] Monthly rent",       amount: 1800, date: "2026-05-01" },
  { slug: "internet",        description: "[preview] Unifi broadband",    amount: 120,  date: "2026-05-01" },
  { slug: "car-loan",        description: "[preview] Car loan payment",   amount: 600,  date: "2026-05-01" },
  { slug: "groceries",       description: "[preview] Jaya Grocer",        amount: 320,  date: "2026-05-03" },
  { slug: "petrol-toll",     description: "[preview] Petronas fill-up",   amount: 180,  date: "2026-05-06" },
  { slug: "emergency-fund",  description: "[preview] Emergency fund xfer",amount: 500,  date: "2026-05-07" },
  { slug: "special-occasion",description: "[preview] Travel fund",        amount: 200,  date: "2026-05-07" },
  { slug: "investment-a",    description: "[preview] ASNB top-up",        amount: 500,  date: "2026-05-07" },
  { slug: "dining-out",      description: "[preview] Madam Kwan dinner",  amount: 200,  date: "2026-05-09" },
  { slug: "public-transport",description: "[preview] Grab + LRT",         amount: 100,  date: "2026-05-09" },
  { slug: "insurance",       description: "[preview] AIA premium",        amount: 150,  date: "2026-05-10" },
  { slug: "subscriptions",   description: "[preview] Adobe CC",           amount: 65,   date: "2026-05-10" },
  { slug: "groceries",       description: "[preview] Village Grocer",     amount: 210,  date: "2026-05-12" },
  { slug: "shopping",        description: "[preview] H&M shirt",          amount: 180,  date: "2026-05-13" },
  { slug: "entertainment",   description: "[preview] Movie + bowling",    amount: 150,  date: "2026-05-13" },
  { slug: "petrol-toll",     description: "[preview] Petronas fill-up 2", amount: 190,  date: "2026-05-15" },
  { slug: "subscriptions",   description: "[preview] Netflix + Spotify",  amount: 80,   date: "2026-05-15" },
  { slug: "utilities",       description: "[preview] TNB electricity",    amount: 150,  date: "2026-05-16" },
  { slug: "shopping",        description: "[preview] Uniqlo trousers",    amount: 140,  date: "2026-05-16" },
  { slug: "dining-out",      description: "[preview] Makan @ SS15",       amount: 180,  date: "2026-05-16" },
  { slug: "general-saving",  description: "[preview] Savings transfer",   amount: 500,  date: "2026-05-17" },
  { slug: "investment-b",    description: "[preview] ETF purchase",       amount: 300,  date: "2026-05-17" },
  { slug: "coffee-snacks",   description: "[preview] ZUS Coffee",         amount: 30,   date: "2026-05-17" },
  { slug: "medical",         description: "[preview] Clinic visit",       amount: 145,  date: "2026-05-17" },
  { slug: "groceries",       description: "[preview] Tesco",              amount: 150,  date: "2026-05-17" },
];

async function main() {
  // Find non-admin user (your account)
  const userRow = await db.execute(
    "SELECT id FROM users WHERE is_admin = 0 ORDER BY id LIMIT 1"
  );
  if (userRow.rows.length === 0) {
    console.error("No non-admin user found. Log in once to create your account first.");
    process.exit(1);
  }
  const userId = userRow.rows[0].id as number;
  console.log(`Inserting for user_id=${userId}`);

  let inserted = 0;
  let skipped = 0;

  for (const row of ROWS) {
    const catRow = await db.execute({
      sql: "SELECT id FROM categories WHERE slug = ?",
      args: [row.slug],
    });
    if (catRow.rows.length === 0) {
      console.warn(`  skip — category slug not found: ${row.slug}`);
      skipped++;
      continue;
    }
    const categoryId = catRow.rows[0].id as number;
    const [, monthStr, dayStr] = row.date.split("-");
    const month = parseInt(monthStr, 10);
    const year = 2026;

    // Skip if this exact description already exists for this user/month
    const exists = await db.execute({
      sql: "SELECT id FROM transactions WHERE user_id=? AND month=? AND year=? AND description=?",
      args: [userId, month, year, row.description],
    });
    if (exists.rows.length > 0) {
      console.log(`  skip (exists): ${row.description}`);
      skipped++;
      continue;
    }

    await db.execute({
      sql: "INSERT INTO transactions (category_id, description, amount, date, month, year, user_id) VALUES (?,?,?,?,?,?,?)",
      args: [categoryId, row.description, row.amount, row.date, month, year, userId],
    });
    console.log(`  inserted: ${row.date}  ${row.slug.padEnd(20)}  RM ${row.amount}  — ${row.description}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}  Skipped: ${skipped}`);
  console.log('To remove: DELETE FROM transactions WHERE description LIKE \'[preview]%\'');
}

main().catch((e) => { console.error(e); process.exit(1); });

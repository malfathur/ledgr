export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

const STOCK_CATEGORIES = [
  // ── Level 0 roots ────────────────────────────────────────────────────────────
  { name: "Income", slug: "income", type: "income",  level: 0, parent: null },
  { name: "Bills",  slug: "bills",  type: "expense", level: 0, parent: null },

  // ── Income leaves (level 1) ──────────────────────────────────────────────────
  { name: "Primary Income",   slug: "primary-income",   type: "income", level: 1, parent: "income" },
  { name: "Secondary Income", slug: "secondary-income", type: "income", level: 1, parent: "income" },
  { name: "Passive Income",   slug: "passive-income",   type: "income", level: 1, parent: "income" },
  { name: "Other Income",     slug: "other-income",     type: "income", level: 1, parent: "income" },

  // ── Bills sub-groups (level 1) ───────────────────────────────────────────────
  { name: "Housing",         slug: "housing",       type: "expense", level: 1, parent: "bills" },
  { name: "Transport",       slug: "transport",     type: "expense", level: 1, parent: "bills" },
  { name: "Food",            slug: "food",          type: "expense", level: 1, parent: "bills" },
  { name: "Health & Family", slug: "health-family", type: "expense", level: 1, parent: "bills" },
  { name: "Debts",           slug: "debts",         type: "expense", level: 1, parent: "bills" },
  { name: "Lifestyle",       slug: "lifestyle",     type: "expense", level: 1, parent: "bills" },
  { name: "Savings",         slug: "savings",       type: "expense", level: 1, parent: "bills" },
  { name: "Investment",      slug: "investment",    type: "expense", level: 1, parent: "bills" },

  // ── Housing leaves (level 2) ─────────────────────────────────────────────────
  { name: "Rent / Mortgage",  slug: "rent-mortgage",    type: "expense", level: 2, parent: "housing" },
  { name: "Utilities",        slug: "utilities",         type: "expense", level: 2, parent: "housing" },
  { name: "Internet",         slug: "internet",          type: "expense", level: 2, parent: "housing" },
  { name: "Home Maintenance", slug: "home-maintenance",  type: "expense", level: 2, parent: "housing" },

  // ── Transport leaves (level 2) ───────────────────────────────────────────────
  { name: "Car Loan",             slug: "car-loan",            type: "expense", level: 2, parent: "transport" },
  { name: "Petrol & Toll",        slug: "petrol-toll",         type: "expense", level: 2, parent: "transport" },
  { name: "Public Transport",     slug: "public-transport",    type: "expense", level: 2, parent: "transport" },
  { name: "Vehicle Maintenance",  slug: "vehicle-maintenance", type: "expense", level: 2, parent: "transport" },

  // ── Food leaves (level 2) ────────────────────────────────────────────────────
  { name: "Groceries",       slug: "groceries",    type: "expense", level: 2, parent: "food" },
  { name: "Dining Out",      slug: "dining-out",   type: "expense", level: 2, parent: "food" },
  { name: "Coffee & Snacks", slug: "coffee-snacks",type: "expense", level: 2, parent: "food" },

  // ── Health & Family leaves (level 2) ─────────────────────────────────────────
  { name: "Medical",   slug: "medical",   type: "expense", level: 2, parent: "health-family" },
  { name: "Insurance", slug: "insurance", type: "expense", level: 2, parent: "health-family" },
  { name: "Childcare", slug: "childcare", type: "expense", level: 2, parent: "health-family" },
  { name: "Education", slug: "education", type: "expense", level: 2, parent: "health-family" },

  // ── Debts leaves (level 2) ───────────────────────────────────────────────────
  { name: "Personal Loan", slug: "personal-loan", type: "expense", level: 2, parent: "debts" },
  { name: "Credit Card",   slug: "credit-card",   type: "expense", level: 2, parent: "debts" },
  { name: "Study Loan",    slug: "study-loan",    type: "expense", level: 2, parent: "debts" },
  { name: "Other Debt",    slug: "other-debt",    type: "expense", level: 2, parent: "debts" },

  // ── Lifestyle leaves (level 2) ───────────────────────────────────────────────
  { name: "Subscriptions", slug: "subscriptions", type: "expense", level: 2, parent: "lifestyle" },
  { name: "Entertainment", slug: "entertainment", type: "expense", level: 2, parent: "lifestyle" },
  { name: "Shopping",      slug: "shopping",      type: "expense", level: 2, parent: "lifestyle" },
  { name: "Travel",        slug: "travel",        type: "expense", level: 2, parent: "lifestyle" },

  // ── Savings leaves (level 2) ─────────────────────────────────────────────────
  { name: "Emergency Fund",   slug: "emergency-fund",   type: "expense", level: 2, parent: "savings" },
  { name: "General Saving",   slug: "general-saving",   type: "expense", level: 2, parent: "savings" },
  { name: "Special Occasion", slug: "special-occasion", type: "expense", level: 2, parent: "savings" },

  // ── Investment leaves (level 2) ───────────────────────────────────────────────
  { name: "Investment A", slug: "investment-a", type: "expense", level: 2, parent: "investment" },
  { name: "Investment B", slug: "investment-b", type: "expense", level: 2, parent: "investment" },
];

export async function POST(req: NextRequest) {
  if (req.headers.get("x-is-admin") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await ensureDb();

  const body = await req.json().catch(() => ({}));
  const skeleton = body.skeleton === true;

  // Wipe all user data before reseeding categories (FK order)
  await db.execute("DELETE FROM commitment_payments");
  await db.execute("DELETE FROM commitments");
  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM monthly_budgets");
  await db.execute("DELETE FROM categories");
  const toInsert = skeleton ? STOCK_CATEGORIES.filter((c) => c.level === 1) : STOCK_CATEGORIES;

  const idMap: Record<string, number> = {};

  for (const cat of toInsert) {
    const parentId = cat.parent ? idMap[cat.parent] : null;
    const result = await db.execute({
      sql: "INSERT INTO categories (name, slug, parent_id, level, type) VALUES (?, ?, ?, ?, ?) RETURNING id",
      args: [cat.name, cat.slug, parentId, cat.level, cat.type],
    });
    idMap[cat.slug] = result.rows[0].id as number;
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const userId = Number(req.headers.get("x-user-id") ?? "0");

  if (!month || !year) {
    return NextResponse.json({ error: "month and year required" }, { status: 400 });
  }

  try {
    const db = await ensureDb();
    const categories = await db.execute("SELECT * FROM categories ORDER BY level, parent_id, id");
    const budgets = await db.execute({
      sql: "SELECT category_id, expected_amount FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
      args: [month, year, userId],
    });

    const budgetMap: Record<number, number> = {};
    for (const row of budgets.rows) {
      budgetMap[row.category_id as number] = row.expected_amount as number;
    }

    return NextResponse.json({ categories: categories.rows, budgetMap });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { month, year, budgets } = await req.json() as {
    month: number;
    year: number;
    budgets: { category_id: number; amount: number }[];
  };
  const userId = Number(req.headers.get("x-user-id") ?? "0");

  if (!month || !year || !Array.isArray(budgets)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const db = await ensureDb();
    for (const { category_id, amount } of budgets) {
      await db.execute({
        sql: `INSERT INTO monthly_budgets (category_id, month, year, user_id, expected_amount)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (category_id, month, year, user_id) DO UPDATE SET expected_amount = excluded.expected_amount`,
        args: [category_id, month, year, userId, amount],
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { getTransactions } from "@/lib/transactions";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const userId = Number(req.headers.get("x-user-id") ?? "0");

  if (!month || !year) {
    return NextResponse.json({ error: "month and year required" }, { status: 400 });
  }

  try {
    const transactions = await getTransactions(month, year, userId);
    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { category_id, description, amount, date } = await req.json();
  const userId = Number(req.headers.get("x-user-id") ?? "0");

  if (!category_id || !amount || !date) {
    return NextResponse.json({ error: "category_id, amount and date required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const [year, month] = date.split("-").map(Number);

  try {
    const db = await ensureDb();
    await db.execute({
      sql: `INSERT INTO transactions (category_id, description, amount, date, month, year, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [category_id, description ?? "", amount, date, month, year, userId],
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

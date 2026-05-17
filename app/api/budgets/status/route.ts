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

  const db = await ensureDb();
  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
    args: [month, year, userId],
  });

  const count = result.rows[0].count as number;
  return NextResponse.json({ isSet: count > 0 });
}

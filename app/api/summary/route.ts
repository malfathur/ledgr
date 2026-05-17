export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getMonthSummary } from "@/lib/summary";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const userId = Number(req.headers.get("x-user-id") ?? "0");

  if (!month || !year) {
    return NextResponse.json({ error: "month and year required" }, { status: 400 });
  }

  try {
    const summary = await getMonthSummary(month, year, userId);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

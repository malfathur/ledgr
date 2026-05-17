export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { category_id, amount, description, date } = await req.json();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const [year, month] = date.split("-").map(Number);

  try {
    const db = await ensureDb();
    await db.execute({
      sql: `UPDATE transactions SET category_id = ?, amount = ?, description = ?, date = ?, month = ?, year = ? WHERE id = ? AND user_id = ?`,
      args: [category_id, amount, description ?? "", date, month, year, id, userId],
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const db = await ensureDb();
    await db.execute({ sql: "DELETE FROM transactions WHERE id = ? AND user_id = ?", args: [id, userId] });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

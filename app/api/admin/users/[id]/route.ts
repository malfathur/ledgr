export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (req.headers.get("x-is-admin") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const db = await ensureDb();

    const user = await db.execute({ sql: "SELECT username FROM users WHERE id = ?", args: [id] });
    if (!user.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if ((user.rows[0].username as string) === "admin") {
      return NextResponse.json({ error: "Cannot delete admin user" }, { status: 400 });
    }

    const adminRow = await db.execute("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (adminRow.rows.length > 0) {
      const adminId = adminRow.rows[0].id;
      await db.execute({ sql: "UPDATE transactions SET user_id = ? WHERE user_id = ?", args: [adminId, id] });
    }
    await db.execute({ sql: "DELETE FROM monthly_budgets WHERE user_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (req.headers.get("x-is-admin") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "password required" }, { status: 400 });

  try {
    const db = await ensureDb();
    const result = await db.execute({ sql: "SELECT username FROM users WHERE id = ?", args: [id] });
    if (!result.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if ((result.rows[0].username as string) === "admin") {
      return NextResponse.json({ error: "Cannot reset admin password here — change ROOT_PASSWORD env var" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [passwordHash, id] });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

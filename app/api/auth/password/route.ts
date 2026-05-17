import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest) {
  const userId = Number(headers().get("x-user-id") ?? "0");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (headers().get("x-is-admin") === "1") {
    return NextResponse.json({ error: "Admin password is managed via the ROOT_PASSWORD environment variable" }, { status: 400 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const db = await ensureDb();
    const row = await db.execute({ sql: "SELECT password_hash FROM users WHERE id = ?", args: [userId] });
    if (!row.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, row.rows[0].password_hash as string);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [hash, userId] });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

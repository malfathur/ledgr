export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-is-admin") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = await ensureDb();
    const result = await db.execute(
      "SELECT id, username, is_admin, created_at FROM users ORDER BY created_at ASC"
    );
    return NextResponse.json({ users: result.rows });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-is-admin") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  if (username === "admin") {
    return NextResponse.json({ error: "Cannot create user with reserved username" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const db = await ensureDb();
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)",
      args: [username, passwordHash],
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json({ error: `Username "${username}" already exists` }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { ensureDb } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  try {
    const db = await ensureDb();
    let userId: number;
    let isAdmin: boolean;

    if (username === "admin") {
      if (password !== process.env.ROOT_PASSWORD) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      let adminRow = await db.execute("SELECT id, password_hash FROM users WHERE username = 'admin' LIMIT 1");
      if (!adminRow.rows.length) {
        const hash = await bcrypt.hash(password, 10);
        await db.execute({
          sql: "INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', ?, 1)",
          args: [hash],
        });
        adminRow = await db.execute("SELECT id, password_hash FROM users WHERE username = 'admin' LIMIT 1");
        const adminId = adminRow.rows[0].id;
        await db.execute({ sql: "UPDATE transactions SET user_id = ? WHERE user_id IS NULL", args: [adminId] });
        await db.execute({ sql: "UPDATE monthly_budgets SET user_id = ? WHERE user_id IS NULL", args: [adminId] });
      } else if (!adminRow.rows[0].password_hash) {
        const hash = await bcrypt.hash(password, 10);
        await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE username = 'admin'", args: [hash] });
      }

      userId = adminRow.rows[0].id as number;
      isAdmin = true;
    } else {
      const userRow = await db.execute({
        sql: "SELECT id, password_hash, is_admin FROM users WHERE username = ? LIMIT 1",
        args: [username],
      });

      if (!userRow.rows.length) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const user = userRow.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash as string);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      userId = user.id as number;
      isAdmin = (user.is_admin as number) === 1;
    }

    const token = await signSession(userId, isAdmin);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

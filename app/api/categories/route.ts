export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { addCategory } from "@/lib/categories";

export async function GET() {
  try {
    const db = await ensureDb();
    const result = await db.execute("SELECT * FROM categories ORDER BY level, parent_id, id");
    return NextResponse.json({ categories: result.rows });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = req.headers.get("x-is-admin") === "1";
  if (!isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { name, parentId } = await req.json();
  if (!name?.trim() || !parentId) {
    return NextResponse.json({ error: "name and parentId required" }, { status: 400 });
  }

  try {
    await addCategory(name.trim(), Number(parentId));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

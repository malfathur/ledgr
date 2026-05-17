export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { deleteCategory } from "@/lib/categories";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = req.headers.get("x-is-admin") === "1";
  if (!isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const result = await deleteCategory(id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  return NextResponse.json({ ok: true });
}

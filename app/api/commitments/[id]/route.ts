export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { updateCommitment, deleteCommitment } from "@/lib/commitments";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { name, amount, due_day, category_id } = await req.json();

  if (due_day !== undefined && (due_day < 1 || due_day > 31)) {
    return NextResponse.json({ error: "due_day must be between 1 and 31" }, { status: 400 });
  }

  try {
    await updateCommitment(id, userId, { name, amount, due_day, category_id });
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
    await deleteCommitment(id, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

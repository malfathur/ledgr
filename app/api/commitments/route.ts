export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCommitments, createCommitment } from "@/lib/commitments";

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  try {
    const commitments = await getCommitments(userId);
    return NextResponse.json({ commitments });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  const { name, amount, due_day, category_id } = await req.json();

  if (!name || amount == null || !due_day) {
    return NextResponse.json({ error: "name, amount and due_day required" }, { status: 400 });
  }

  if (due_day < 1 || due_day > 31) {
    return NextResponse.json({ error: "due_day must be between 1 and 31" }, { status: 400 });
  }

  try {
    await createCommitment(userId, name, Number(amount), Number(due_day), category_id ?? null);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

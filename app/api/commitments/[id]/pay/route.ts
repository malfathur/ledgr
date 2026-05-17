export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { markCommitmentPaid, getCommitments } from "@/lib/commitments";
import { ensureDb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const commitmentId = Number(params.id);
  const userId = Number(req.headers.get("x-user-id") ?? "0");
  if (!commitmentId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Record the payment
  await markCommitmentPaid(commitmentId, userId, month, year);

  // Auto-create a transaction if the commitment has a linked category
  const commitments = await getCommitments(userId);
  const commitment = commitments.find((c) => c.id === commitmentId);

  if (commitment?.category_id) {
    const db = await ensureDb();
    const today = now.toISOString().split("T")[0];
    await db.execute({
      sql: `INSERT INTO transactions (user_id, category_id, amount, description, date, month, year)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, commitment.category_id, commitment.amount, commitment.name, today, month, year],
    });
  }

  return NextResponse.json({ ok: true });
}

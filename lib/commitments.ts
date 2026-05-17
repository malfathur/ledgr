import { ensureDb } from "./db";
import type { InValue } from "@libsql/client";

export type Commitment = {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  due_day: number;
  category_id: number | null;
  is_active: number;
  created_at: string;
};

export async function getCommitments(userId: number): Promise<Commitment[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: "SELECT * FROM commitments WHERE user_id = ? AND is_active = 1 ORDER BY due_day ASC",
    args: [userId],
  });
  return result.rows as unknown as Commitment[];
}

export async function createCommitment(
  userId: number,
  name: string,
  amount: number,
  due_day: number,
  category_id: number | null
): Promise<void> {
  const db = await ensureDb();
  await db.execute({
    sql: `INSERT INTO commitments (user_id, name, amount, due_day, category_id)
          VALUES (?, ?, ?, ?, ?)`,
    args: [userId, name, amount, due_day, category_id ?? null],
  });
}

export async function updateCommitment(
  id: number,
  userId: number,
  fields: { name?: string; amount?: number; due_day?: number; category_id?: number | null }
): Promise<void> {
  const db = await ensureDb();
  const sets: string[] = [];
  const args: InValue[] = [];

  if (fields.name !== undefined)        { sets.push("name = ?");        args.push(fields.name); }
  if (fields.amount !== undefined)      { sets.push("amount = ?");      args.push(fields.amount); }
  if (fields.due_day !== undefined)     { sets.push("due_day = ?");     args.push(fields.due_day); }
  if ("category_id" in fields)          { sets.push("category_id = ?"); args.push(fields.category_id ?? null); }

  if (sets.length === 0) return;

  args.push(id, userId);
  await db.execute({
    sql: `UPDATE commitments SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  });
}

export async function deleteCommitment(id: number, userId: number): Promise<void> {
  const db = await ensureDb();
  await db.execute({
    sql: "UPDATE commitments SET is_active = 0 WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

export async function getPaidCommitmentIds(
  userId: number,
  month: number,
  year: number
): Promise<number[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: "SELECT commitment_id FROM commitment_payments WHERE user_id = ? AND month = ? AND year = ?",
    args: [userId, month, year],
  });
  return result.rows.map((r) => r.commitment_id as number);
}

export async function markCommitmentPaid(
  commitmentId: number,
  userId: number,
  month: number,
  year: number
): Promise<void> {
  const db = await ensureDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO commitment_payments (commitment_id, user_id, month, year) VALUES (?, ?, ?, ?)",
    args: [commitmentId, userId, month, year],
  });
}

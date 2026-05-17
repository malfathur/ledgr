import { ensureDb } from "./db";

export type Transaction = {
  id: number;
  user_id: number;
  category_id: number;
  description: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  created_at: string;
  category_name: string;
  category_slug: string;
  parent_id: number | null;
};

export async function getTransactions(month: number, year: number, userId: number): Promise<Transaction[]> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: `SELECT t.*, c.name as category_name, c.slug as category_slug, c.parent_id
          FROM transactions t
          JOIN categories c ON c.id = t.category_id
          WHERE t.month = ? AND t.year = ? AND t.user_id = ?
          ORDER BY t.date DESC, t.created_at DESC`,
    args: [month, year, userId],
  });
  return result.rows as unknown as Transaction[];
}

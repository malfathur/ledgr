import { ensureDb } from "./db";

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  type: string;
};

export async function getAllCategories(): Promise<Category[]> {
  const db = await ensureDb();
  const result = await db.execute("SELECT * FROM categories ORDER BY level, parent_id, id");
  return result.rows as unknown as Category[];
}

export async function getBudgetData(month: number, year: number, userId: number) {
  const db = await ensureDb();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const [cats, budgets, prevActualsResult] = await Promise.all([
    getAllCategories(),
    db.execute({
      sql: "SELECT category_id, expected_amount FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
      args: [month, year, userId],
    }),
    db.execute({
      sql: "SELECT category_id, SUM(amount) as total FROM transactions WHERE month = ? AND year = ? AND user_id = ? GROUP BY category_id",
      args: [prevMonth, prevYear, userId],
    }),
  ]);

  const budgetMap: Record<number, number> = {};
  for (const row of budgets.rows) budgetMap[row.category_id as number] = row.expected_amount as number;

  const prevActuals: Record<number, number> = {};
  for (const row of prevActualsResult.rows) prevActuals[row.category_id as number] = row.total as number;

  return { categories: cats, budgetMap, prevActuals };
}

export async function addCategory(
  name: string,
  parentId: number
): Promise<void> {
  const db = await ensureDb();
  const parent = await db.execute({ sql: "SELECT * FROM categories WHERE id = ?", args: [parentId] });
  if (parent.rows.length === 0) throw new Error("Parent category not found");
  const p = parent.rows[0];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  await db.execute({
    sql: "INSERT INTO categories (name, slug, parent_id, level, type) VALUES (?, ?, ?, ?, ?)",
    args: [name, slug, parentId, (p.level as number) + 1, p.type],
  });
}

export async function deleteCategory(id: number): Promise<{ ok: boolean; reason?: string }> {
  const db = await ensureDb();
  const txCount = await db.execute({
    sql: "SELECT COUNT(*) as count FROM transactions WHERE category_id = ?",
    args: [id],
  });
  if ((txCount.rows[0].count as number) > 0) {
    return { ok: false, reason: "Category has existing transactions" };
  }
  await db.execute({ sql: "DELETE FROM monthly_budgets WHERE category_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
  return { ok: true };
}

export async function getBudgetStatus(month: number, year: number, userId: number): Promise<boolean> {
  const db = await ensureDb();
  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
    args: [month, year, userId],
  });
  return (result.rows[0].count as number) > 0;
}

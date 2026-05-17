import { ensureDb } from "./db";

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  type: string;
  expected: number;
  actual: number;
  available: number;
  children: CategoryNode[];
};

export type MonthlySummary = {
  tree: CategoryNode[];
  surplus: number;
};

export async function getMonthSummary(month: number, year: number, userId: number): Promise<MonthlySummary> {
  const db = await ensureDb();
  const [cats, budgets, actuals] = await Promise.all([
    db.execute("SELECT * FROM categories ORDER BY level, parent_id, id"),
    db.execute({
      sql: "SELECT category_id, expected_amount FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
      args: [month, year, userId],
    }),
    db.execute({
      sql: "SELECT category_id, SUM(amount) as total FROM transactions WHERE month = ? AND year = ? AND user_id = ? GROUP BY category_id",
      args: [month, year, userId],
    }),
  ]);

  const categories = cats.rows as unknown as Omit<CategoryNode, "expected" | "actual" | "available" | "children">[];
  const budgetMap: Record<number, number> = {};
  for (const row of budgets.rows) budgetMap[row.category_id as number] = row.expected_amount as number;
  const actualMap: Record<number, number> = {};
  for (const row of actuals.rows) actualMap[row.category_id as number] = row.total as number;

  function build(parentId: number | null): CategoryNode[] {
    return categories
      .filter((c) => c.parent_id === parentId)
      .map((c) => {
        const children = build(c.id);
        const isLeaf = children.length === 0;
        const expected = isLeaf ? (budgetMap[c.id] ?? 0) : children.reduce((s, ch) => s + ch.expected, 0);
        const actual = isLeaf ? (actualMap[c.id] ?? 0) : children.reduce((s, ch) => s + ch.actual, 0);
        return { ...c, expected, actual, available: expected - actual, children };
      });
  }

  const tree = build(null);
  const incomeNode = tree.find((n) => n.slug === "income");
  const totalExpenseActual = tree.filter((n) => n.type === "expense").reduce((s, n) => s + n.actual, 0);
  const surplus = (incomeNode?.actual ?? 0) - totalExpenseActual;

  return { tree, surplus };
}

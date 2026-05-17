export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import AddTransactionForm from "@/components/AddTransactionForm";
import { getAllCategories } from "@/lib/categories";
import { ensureDb } from "@/lib/db";

export default async function AddPage({ searchParams }: { searchParams?: { category?: string } }) {
  const userId = Number(headers().get("x-user-id") ?? "0");
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.toISOString().split("T")[0];

  const categories = await getAllCategories();
  const db = await ensureDb();

  const [budgets, spending] = await Promise.all([
    db.execute({
      sql: "SELECT category_id, expected_amount FROM monthly_budgets WHERE month = ? AND year = ? AND user_id = ?",
      args: [month, year, userId],
    }),
    db.execute({
      sql: "SELECT category_id, SUM(amount) as total FROM transactions WHERE month = ? AND year = ? AND user_id = ? GROUP BY category_id",
      args: [month, year, userId],
    }),
  ]);

  const budgetMap: Record<number, number> = {};
  for (const r of budgets.rows) budgetMap[r.category_id as number] = r.expected_amount as number;

  const spentMap: Record<number, number> = {};
  for (const r of spending.rows) spentMap[r.category_id as number] = r.total as number;

  return (
    <AddTransactionForm
      categories={categories}
      today={today}
      budgetMap={budgetMap}
      spentMap={spentMap}
      defaultCategory={searchParams?.category}
    />
  );
}

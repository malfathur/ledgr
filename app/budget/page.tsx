export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import BudgetForm from "@/components/BudgetForm";
import { getBudgetData } from "@/lib/categories";

export default async function BudgetPage() {
  const userId = Number(headers().get("x-user-id") ?? "0");
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { categories, budgetMap, prevActuals } = await getBudgetData(month, year, userId);

  return <BudgetForm month={month} year={year} categories={categories} budgetMap={budgetMap} prevActuals={prevActuals} />;
}

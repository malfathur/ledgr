import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import { getBudgetStatus, getAllCategories } from "@/lib/categories";
import { getMonthSummary } from "@/lib/summary";
import { getTransactions } from "@/lib/transactions";
import { getCommitments, getPaidCommitmentIds } from "@/lib/commitments";
import { deriveAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = Number(headers().get("x-user-id") ?? "0");
  const isAdmin = headers().get("x-is-admin") === "1";

  if (isAdmin) {
    const cats = await getAllCategories();
    if (cats.length === 0) redirect("/onboarding");
  }
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgetIsSet, { tree, surplus }, transactions, commitments, paidIds] = await Promise.all([
    getBudgetStatus(month, year, userId),
    getMonthSummary(month, year, userId),
    getTransactions(month, year, userId),
    getCommitments(userId),
    getPaidCommitmentIds(userId, month, year),
  ]);

  const alerts = deriveAlerts(commitments, paidIds, tree, now);

  return (
    <main>
      <DashboardClient
        tree={tree}
        surplus={surplus}
        transactions={transactions}
        commitments={commitments}
        paidIds={paidIds}
        alerts={alerts}
        month={month}
        year={year}
        budgetIsSet={budgetIsSet}
        isAdmin={isAdmin}
      />
    </main>
  );
}

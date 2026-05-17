import { headers } from "next/headers";
import Link from "next/link";
import MonthSelector from "@/components/MonthSelector";
import SpendingTable from "@/components/SpendingTable";
import type { SpendingRow } from "@/components/SpendingTable";
import { getMonthSummary, type CategoryNode } from "@/lib/summary";
import { fmtRM } from "@/lib/fmt";

export const dynamic = "force-dynamic";

function flattenExpenses(nodes: CategoryNode[], depth = 0): SpendingRow[] {
  const rows: SpendingRow[] = [];
  for (const node of nodes) {
    const isLeaf = node.children.length === 0;
    if (isLeaf) {
      rows.push({ kind: "leaf", node, depth });
    } else {
      rows.push({ kind: "group-header", node, depth });
      rows.push(...flattenExpenses(node.children, depth + 1));
      rows.push({ kind: "subtotal", node, depth });
    }
  }
  return rows;
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const userId = Number(headers().get("x-user-id") ?? "0");
  const now = new Date();
  const month = Number(searchParams.month) || now.getMonth() + 1;
  const year  = Number(searchParams.year)  || now.getFullYear();

  const { tree, surplus } = await getMonthSummary(month, year, userId);

  const incomeNode    = tree.find((n) => n.slug === "income");
  const expenseRoots  = tree.filter((n) => n.type === "expense");
  const expenseRows   = flattenExpenses(expenseRoots);
  const totalExpenseActual   = expenseRoots.reduce((s, n) => s + n.actual, 0);
  const totalExpenseExpected = expenseRoots.reduce((s, n) => s + n.expected, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white">←</Link>
          <h1 className="text-xl font-semibold">Spending Breakdown</h1>
        </div>
        <MonthSelector month={month} year={year} />
      </div>

      {/* ── Net this month ───────────────────────────────────────────────── */}
      <div className={`mb-4 rounded-xl px-5 py-4 text-center ${surplus >= 0 ? "bg-emerald-950" : "bg-red-950"}`}>
        <p className="mb-1 text-sm text-gray-400">Net this month</p>
        <p className={`text-3xl font-bold ${surplus >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {surplus < 0 ? "−" : ""}{fmtRM(Math.abs(surplus))}
        </p>
      </div>

      {/* ── Spending Breakdown ───────────────────────────────────────────── */}
      <section className="mb-4 rounded-xl bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-rose-400">Spending</h2>
          <span className="text-xs text-gray-500">
            {fmtRM(totalExpenseActual)} of {fmtRM(totalExpenseExpected)} budgeted
          </span>
        </div>
        <SpendingTable rows={expenseRows} />
      </section>

      {/* ── Income ───────────────────────────────────────────────────────── */}
      <section className="rounded-xl bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-indigo-400">Income</h2>
          <span className="text-xs text-gray-500">
            {fmtRM(incomeNode?.actual ?? 0)} received
            {incomeNode?.expected ? ` of ${fmtRM(incomeNode.expected)} expected` : ""}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-900">
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="py-2 pl-4 text-left font-medium">Source</th>
              <th className="py-2 pr-3 text-right font-medium">Expected</th>
              <th className="py-2 pr-4 text-right font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(incomeNode?.children ?? []).map((leaf) => (
              <tr key={leaf.id} className="hover:bg-gray-800/30">
                <td className="py-2.5 pl-4 text-gray-300">{leaf.name}</td>
                <td className="py-2.5 pr-3 text-right text-gray-500">
                  {leaf.expected > 0 ? fmtRM(leaf.expected) : <span className="text-gray-700">—</span>}
                </td>
                <td className={`py-2.5 pr-4 text-right font-medium ${leaf.actual > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                  {leaf.actual > 0 ? fmtRM(leaf.actual) : <span>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </main>
  );
}

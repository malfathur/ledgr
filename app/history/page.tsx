import { headers } from "next/headers";
import Link from "next/link";
import MonthSelector from "@/components/MonthSelector";
import TransactionList from "@/components/TransactionList";
import { getAllCategories } from "@/lib/categories";
import { getTransactions } from "@/lib/transactions";
import { fmtRM } from "@/lib/fmt";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const userId = Number(headers().get("x-user-id") ?? "0");
  const now = new Date();
  const month = Number(searchParams.month) || now.getMonth() + 1;
  const year  = Number(searchParams.year)  || now.getFullYear();

  const [transactions, categories] = await Promise.all([
    getTransactions(month, year, userId),
    getAllCategories(),
  ]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const catTypeById: Record<number, string> = {};
  for (const cat of categories) catTypeById[cat.id] = cat.type;

  const incomeTotal = transactions
    .filter((t) => catTypeById[t.category_id] === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => catTypeById[t.category_id] === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = incomeTotal - expenseTotal;

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white">←</Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">History</h1>
            <Link href="/budget" className="text-sm text-gray-600 hover:text-gray-400">Budget</Link>
          </div>
        </div>
        <MonthSelector month={month} year={year} basePath="/history" />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3">
        <p className="text-sm text-gray-500">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} · {MONTHS[month - 1]} {year}
        </p>
        <p className={`text-sm font-medium ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {net >= 0 ? "+" : "−"}{fmtRM(net)}
        </p>
      </div>

      <TransactionList transactions={transactions} categories={categories} month={month} year={year} />

      <Link
        href="/add"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-lg hover:bg-indigo-500"
      >
        +
      </Link>
    </main>
  );
}

export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import Link from "next/link";
import { getAllCategories, getBudgetData } from "@/lib/categories";
import { getCommitments } from "@/lib/commitments";
import SetupCategories from "@/components/SetupCategories";
import SetupCommitments from "@/components/SetupCommitments";

export default async function SetupPage({ searchParams }: { searchParams: { from?: string } }) {
  const isAdmin = headers().get("x-is-admin") === "1";
  const userId = Number(headers().get("x-user-id") ?? "0");
  const fromOnboarding = searchParams.from === "onboarding";

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [categories, commitments, { budgetMap }] = await Promise.all([
    getAllCategories(),
    getCommitments(userId),
    getBudgetData(month, year, userId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href={fromOnboarding ? "/onboarding" : "/"} className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-xl font-semibold">Setup</h1>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Categories ── */}
        <section className="rounded-xl bg-gray-900 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-medium text-gray-100">Categories</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Leaf categories appear in Budget, Add Transaction, and Spending Breakdown.
                {!isAdmin && " Contact an admin to make changes."}
              </p>
            </div>
            {isAdmin && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">
                Admin
              </span>
            )}
          </div>
          <SetupCategories initialCategories={categories} isAdmin={isAdmin} />
        </section>

        {/* ── Commitments ── */}
        <section className="rounded-xl bg-gray-900 p-5">
          <div className="mb-4">
            <h2 className="font-medium text-gray-100">Commitments</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Monthly fixed obligations. Mark them as paid from the dashboard each month.
            </p>
          </div>
          <SetupCommitments initialCommitments={commitments} categories={categories} budgetMap={budgetMap} />
        </section>

      </div>

      {fromOnboarding && (
        <div className="mt-8">
          <Link
            href="/"
            className="block w-full rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Proceed to App →
          </Link>
        </div>
      )}

    </main>
  );
}

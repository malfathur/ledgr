"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BudgetRequiredModal() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 text-center">
        <div className="mb-3 text-3xl">📋</div>
        <h2 className="mb-2 text-lg font-semibold">Budget not set</h2>
        <p className="mb-6 text-sm text-gray-400">
          Set your expected amounts for this month before tracking expenses.
        </p>
        <button
          onClick={() => router.push("/budget")}
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium hover:bg-indigo-500"
        >
          Set Budget
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 w-full rounded-lg py-2 text-sm text-gray-500 hover:text-gray-300"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

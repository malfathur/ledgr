"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  type: string;
};

type Props = {
  categories: Category[];
  today: string;
  budgetMap: Record<number, number>;
  spentMap: Record<number, number>;
  defaultCategory?: string;
};

export default function AddTransactionForm({ categories, today, budgetMap, spentMap, defaultCategory }: Props) {
  const router = useRouter();

  // Build helpers (computed before state so lazy init can use them)
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const childrenOf = (pid: number | null) => categories.filter((c) => c.parent_id === pid);
  const isLeaf = (id: number) => childrenOf(id).length === 0;
  const leaves = categories.filter((c) => isLeaf(c.id));

  const [categoryId, setCategoryId] = useState(() => {
    if (!defaultCategory) return "";
    const match = leaves.find((l) => l.slug === defaultCategory);
    return match ? String(match.id) : "";
  });
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Build display path for a leaf: "Income > Salary"
  function path(cat: Category): string {
    const parts: string[] = [cat.name];
    let cur = cat;
    while (cur.parent_id !== null) {
      const parent = byId[cur.parent_id];
      if (!parent) break;
      parts.unshift(parent.name);
      cur = parent;
    }
    return parts.join(" › ");
  }

  // Group leaves by top-level root for optgroups
  function rootOf(cat: Category): Category {
    let cur = cat;
    while (cur.parent_id !== null) {
      const parent = byId[cur.parent_id];
      if (!parent) break;
      cur = parent;
    }
    return cur;
  }

  const roots = categories.filter((c) => c.parent_id === null);
  const leavesByRoot = Object.fromEntries(
    roots.map((r) => [r.id, leaves.filter((l) => rootOf(l).id === r.id)])
  );

  function categoryBalanceHint() {
    if (!categoryId) return null;
    const id = Number(categoryId);
    const budget = budgetMap[id];
    if (!budget) return null;
    const spent = spentMap[id] ?? 0;
    const remaining = budget - spent;
    const isIncome = rootOf(byId[id])?.type === "income";
    if (isIncome) {
      return { label: "Received", value: spent, total: budget, remaining, over: false };
    }
    return { label: "Remaining", value: remaining, total: budget, remaining, over: remaining < 0 };
  }

  const hint = categoryBalanceHint();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !amount || !date) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: Number(categoryId),
        description,
        amount: parseFloat(amount),
        date,
      }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Failed to save. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">Add Transaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg bg-gray-800 px-4 py-3 text-base outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          >
            <option value="">Select category…</option>
            {roots.map((root) =>
              leavesByRoot[root.id]?.length ? (
                <optgroup key={root.id} label={root.name}>
                  {leavesByRoot[root.id].map((leaf) => (
                    <option key={leaf.id} value={leaf.id}>
                      {path(leaf)}
                    </option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
          {hint && (
            <p className={`text-xs mt-1 ${hint.over ? "text-red-400" : "text-gray-500"}`}>
              {hint.over
                ? `Over budget by RM ${Math.abs(hint.remaining).toFixed(2)} (budget: RM ${hint.total.toFixed(2)})`
                : hint.label === "Received"
                ? `Received RM ${hint.value.toFixed(2)} of RM ${hint.total.toFixed(2)}`
                : `RM ${hint.remaining.toFixed(2)} remaining of RM ${hint.total.toFixed(2)}`}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Amount</label>
          <div className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 ring-1 ring-gray-700 focus-within:ring-indigo-500">
            <span className="text-gray-500">RM</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent py-3 text-base outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Description (optional)</label>
          <input
            type="text"
            placeholder="e.g. Groceries"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg bg-gray-800 px-4 py-3 text-base outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg bg-gray-800 px-4 py-3 text-base outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-indigo-600 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add Transaction"}
        </button>
      </form>
    </main>
  );
}

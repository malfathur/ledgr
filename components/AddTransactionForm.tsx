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

  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const childrenOf = (pid: number | null) => categories.filter((c) => c.parent_id === pid);
  const isLeaf = (id: number) => childrenOf(id).length === 0;
  const leaves = categories.filter((c) => isLeaf(c.id));

  function rootOf(cat: Category): Category {
    let cur = cat;
    while (cur.parent_id !== null) {
      const parent = byId[cur.parent_id];
      if (!parent) break;
      cur = parent;
    }
    return cur;
  }

  const [categoryId, setCategoryId] = useState(() => {
    if (!defaultCategory) return "";
    const match = leaves.find((l) => l.slug === defaultCategory);
    return match ? String(match.id) : "";
  });
  const [rootId, setRootId] = useState(() => {
    if (!defaultCategory) return "";
    const match = leaves.find((l) => l.slug === defaultCategory);
    if (!match) return "";
    return String(rootOf(match).id);
  });
  const [midId, setMidId] = useState(() => {
    if (!defaultCategory) return "";
    const match = leaves.find((l) => l.slug === defaultCategory);
    if (!match || match.parent_id === null) return "";
    const parent = byId[match.parent_id];
    if (!parent || parent.parent_id === null) return "";
    return String(parent.id);
  });
  const [step, setStep] = useState(() => {
    if (!defaultCategory) return 1;
    const match = leaves.find((l) => l.slug === defaultCategory);
    if (!match) return 1;
    const parent = match.parent_id !== null ? byId[match.parent_id] : null;
    return parent && parent.parent_id !== null ? 3 : 2;
  });
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roots = categories.filter((c) => c.parent_id === null);

  const currentRootChildren = rootId ? childrenOf(Number(rootId)) : [];
  const isDirectLeafRoot = currentRootChildren.length > 0 && currentRootChildren.every((c) => isLeaf(c.id));
  const stepLabels = isDirectLeafRoot ? ["Type", "Category"] : ["Type", "Group", "Category"];

  function handleRootPick(id: string) {
    setRootId(id); setMidId(""); setCategoryId("");
    setTimeout(() => setStep(2), 120);
  }
  function handleMidPick(id: string) {
    setMidId(id); setCategoryId("");
    setTimeout(() => setStep(3), 120);
  }
  function goBack() {
    if (step === 2) { setRootId(""); setMidId(""); setCategoryId(""); setStep(1); }
    else if (step === 3 && isDirectLeafRoot) { setCategoryId(""); setStep(2); }
    else if (step === 3) { setMidId(""); setCategoryId(""); setStep(2); }
  }

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
    if (!categoryId) { setError("Please select a category."); return; }
    if (!amount) { setError("Please enter an amount."); return; }
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
      const [txYear, txMonth] = date.split("-").map(Number);
      const now = new Date();
      const isCurrentMonth = txMonth === now.getMonth() + 1 && txYear === now.getFullYear();
      router.push(isCurrentMonth ? "/" : `/history?month=${txMonth}&year=${txYear}`);
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
        {/* Category — step wizard */}
        <div className="flex flex-col gap-4">
          <label className="text-sm text-gray-400">Category</label>

          {/* Context crumb + back */}
          {step > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={goBack} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                ← Back
              </button>
              <span className="text-xs text-gray-600">
                {byId[Number(rootId)]?.name}
                {midId ? ` › ${byId[Number(midId)]?.name}` : ""}
              </span>
            </div>
          )}

          {/* Step 1: root */}
          {step === 1 && (
            <div className="flex flex-col gap-2">
              {roots.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRootPick(String(r.id))}
                  className={`w-full rounded-lg px-4 py-3 text-sm text-left font-medium transition-colors ring-1 ${
                    rootId === String(r.id)
                      ? "bg-indigo-600/20 ring-indigo-500 text-indigo-300"
                      : "bg-gray-800 ring-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: groups (Bills) or leaves (Income) */}
          {step === 2 && (
            <div className="flex flex-col gap-2">
              {currentRootChildren.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (isDirectLeafRoot) { setCategoryId(String(c.id)); setStep(3); }
                    else handleMidPick(String(c.id));
                  }}
                  className={`w-full rounded-lg px-4 py-3 text-sm text-left font-medium transition-colors ring-1 ${
                    (isDirectLeafRoot ? categoryId : midId) === String(c.id)
                      ? "bg-indigo-600/20 ring-indigo-500 text-indigo-300"
                      : "bg-gray-800 ring-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: leaves under group (Bills) or confirmation (Income) */}
          {step === 3 && isDirectLeafRoot && categoryId && (
            <div className="rounded-lg bg-indigo-600/10 ring-1 ring-indigo-500 px-4 py-3">
              <p className="text-sm text-indigo-300 font-medium">{byId[Number(categoryId)]?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Category selected — fill in amount and date below</p>
            </div>
          )}
          {step === 3 && !isDirectLeafRoot && (
            <div className="flex flex-col gap-2">
              {childrenOf(Number(midId)).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(String(c.id))}
                  className={`w-full rounded-lg px-4 py-3 text-sm text-left font-medium transition-colors ring-1 ${
                    categoryId === String(c.id)
                      ? "bg-indigo-600/20 ring-indigo-500 text-indigo-300"
                      : "bg-gray-800 ring-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {hint && (
            <p className={`text-xs ${hint.over ? "text-red-400" : "text-gray-500"}`}>
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

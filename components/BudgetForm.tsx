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
  month: number;
  year: number;
  categories: Category[];
  budgetMap: Record<number, number>;
  prevActuals: Record<number, number>;
};

function fmt(n: number) {
  return n === 0 ? "" : String(n);
}

export default function BudgetForm({ month, year, categories, budgetMap, prevActuals }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const c of categories) {
      init[c.id] = fmt(budgetMap[c.id] ?? 0);
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");
  const [rolloverMsg, setRolloverMsg] = useState("");
  const [tab, setTab] = useState<"income" | "expense">("expense");

  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const childrenOf = (pid: number | null) => categories.filter((c) => c.parent_id === pid);
  const isLeaf = (id: number) => childrenOf(id).length === 0;
  const leafCategories = categories.filter((c) => isLeaf(c.id));

  function getRootOf(id: number): Category | null {
    let cur = byId[id];
    while (cur && cur.parent_id !== null) cur = byId[cur.parent_id];
    return cur ?? null;
  }

  const incomeLeaves = leafCategories.filter((c) => getRootOf(c.id)?.type === "income");
  const expenseLeaves = leafCategories.filter((c) => getRootOf(c.id)?.type !== "income");

  const totalIncome = incomeLeaves.reduce((s, c) => s + (parseFloat(values[c.id] || "0") || 0), 0);
  const totalExpenses = expenseLeaves.reduce((s, c) => s + (parseFloat(values[c.id] || "0") || 0), 0);
  const unallocated = totalIncome - totalExpenses;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const budgets = leafCategories.map((c) => ({
      category_id: c.id,
      amount: parseFloat(values[c.id] || "0") || 0,
    }));

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, budgets }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Failed to save. Please try again.");
    }
  }

  async function handleRollover() {
    setRolling(true);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const res = await fetch(`/api/budgets?month=${prevMonth}&year=${prevYear}`);
    if (res.ok) {
      const data = await res.json();
      const prev: Record<number, number> = data.budgetMap ?? {};
      const filled = Object.values(prev).filter((v) => Number(v) > 0).length;
      setValues((v) => {
        const next = { ...v };
        for (const [id, amt] of Object.entries(prev)) {
          if (Number(amt) > 0) next[Number(id)] = String(amt);
        }
        return next;
      });
      setRolloverMsg(filled > 0 ? `Copied ${filled} values from last month` : "No budget found for last month");
      setTimeout(() => setRolloverMsg(""), 3000);
    }
    setRolling(false);
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function renderLeafCard(cat: Category) {
    const prev = prevActuals[cat.id];
    return (
      <div key={cat.id} className="flex flex-col items-center gap-1.5 rounded-lg bg-gray-800/60 p-2.5">
        <label className="text-xs text-gray-300 leading-tight text-center" title={cat.name}>
          {cat.name}
        </label>
        {prev > 0 && (
          <p className="text-[10px] text-gray-600">last: RM {prev.toFixed(2)}</p>
        )}
        <div className="flex items-center gap-1 mt-auto">
          <span className="text-xs text-gray-500">RM</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={values[cat.id] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [cat.id]: e.target.value }))}
            className="w-24 rounded bg-gray-700 px-2 py-1 text-right text-xs outline-none ring-1 ring-gray-600 focus:ring-indigo-500"
          />
        </div>
      </div>
    );
  }

  function renderGroup(parent: Category | null, depth = 0): React.ReactNode {
    const children = childrenOf(parent?.id ?? null);
    if (children.length === 0) return null;

    const leaves = children.filter((c) => isLeaf(c.id));
    const sections = children.filter((c) => !isLeaf(c.id));

    return (
      <>
        {leaves.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {leaves.map((cat) => renderLeafCard(cat))}
          </div>
        )}
        {sections.map((cat) => (
          <div key={cat.id} className="mt-3">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500"
              style={{ paddingLeft: depth * 12 }}
            >
              {cat.name}
            </p>
            {renderGroup(cat, depth + 1)}
          </div>
        ))}
      </>
    );
  }

  const roots = categories.filter((c) => c.parent_id === null);
  const incomeRoots = roots.filter((r) => r.type === "income");
  const expenseRoots = roots.filter((r) => r.type !== "income");
  const visibleRoots = tab === "income" ? incomeRoots : expenseRoots;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-white">←</a>
            <h1 className="text-xl font-semibold">Budget</h1>
            <a href="/history" className="text-sm text-gray-600 hover:text-gray-400">History</a>
          </div>
          <p className="text-sm text-gray-400">{MONTHS[month - 1]} {year}</p>
        </div>
        <button
          type="button"
          onClick={handleRollover}
          disabled={rolling}
          className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-400 ring-1 ring-gray-700 hover:text-gray-200 disabled:opacity-50"
        >
          {rolling ? "Loading…" : "↩ Copy last month"}
        </button>
        {rolloverMsg && <p className="mt-1 text-right text-xs text-gray-400">{rolloverMsg}</p>}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-lg bg-gray-800/50 p-1 ring-1 ring-gray-700">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gray-700 text-gray-100 shadow"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "income" ? "Income" : "Expenses"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {visibleRoots.map((root) => (
          <section key={root.id} className="rounded-xl bg-gray-900 px-4 py-3">
            <h2 className="mb-3 font-medium text-indigo-400">{root.name}</h2>
            {renderGroup(root, 0)}
          </section>
        ))}

        <section className="rounded-xl bg-gray-900 px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Planned income</span>
            <span className="text-green-400">RM {totalIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Planned spending</span>
            <span className="text-red-400">RM {totalExpenses.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-800 pt-2 flex justify-between text-sm font-medium">
            <span className={unallocated >= 0 ? "text-gray-300" : "text-red-400"}>
              {unallocated >= 0 ? "Unallocated" : "Overallocated"}
            </span>
            <span className={unallocated >= 0 ? "text-gray-100" : "text-red-400"}>
              {unallocated < 0 ? "−" : ""}RM {Math.abs(unallocated).toFixed(2)}
            </span>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Budget"}
        </button>
      </form>
    </main>
  );
}

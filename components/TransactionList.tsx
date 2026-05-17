"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/transactions";
import type { Category } from "@/lib/categories";
import { fmtRM } from "@/lib/fmt";

type Props = {
  transactions: Transaction[];
  categories: Category[];
  month?: number;
  year?: number;
};

type EditFields = { categoryId: string; amount: string; description: string; date: string };

export default function TransactionList({ transactions, categories, month, year }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({ categoryId: "", amount: "", description: "", date: "" });
  const [editSaving, setEditSaving] = useState(false);

  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));

  function catPath(catId: number): string {
    const parts: string[] = [];
    let cur: Category | undefined = byId[catId];
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parent_id !== null ? byId[cur.parent_id] : undefined;
    }
    return parts.join(" › ");
  }

  const childrenOf = (pid: number | null) => categories.filter((c) => c.parent_id === pid);
  const isLeaf = (id: number) => childrenOf(id).length === 0;
  const leaves = categories.filter((c) => isLeaf(c.id));
  const usedCatIds = Array.from(new Set(transactions.map((t) => t.category_id)));

  function isIncome(catId: number): boolean {
    let cur: Category | undefined = byId[catId];
    while (cur && cur.parent_id !== null) cur = byId[cur.parent_id];
    return cur?.slug === "income";
  }

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleDelete(id: number) {
    setDeleting(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setDeleting(null);
    setConfirmId(null);
    router.refresh();
  }

  function openEdit(t: Transaction) {
    setEditingTx(t);
    setEditFields({
      categoryId: String(t.category_id),
      amount: String(t.amount),
      description: t.description ?? "",
      date: t.date,
    });
  }

  async function handleEdit() {
    if (!editingTx) return;
    setEditSaving(true);
    await fetch(`/api/transactions/${editingTx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: Number(editFields.categoryId),
        amount: parseFloat(editFields.amount),
        description: editFields.description,
        date: editFields.date,
      }),
    });
    setEditSaving(false);
    setEditingTx(null);
    router.refresh();
  }

  function exportCSV() {
    const header = "Date,Category,Description,Amount";
    const rows = transactions.map((t) =>
      [t.date, `"${catPath(t.category_id)}"`, `"${(t.description ?? "").replace(/"/g, '""')}"`, t.amount].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    a.download = `transactions-${y}-${String(m).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter chain: category → text search
  let filtered = filter === "all" ? transactions : transactions.filter((t) => String(t.category_id) === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.description ?? "").toLowerCase().includes(q) ||
        catPath(t.category_id).toLowerCase().includes(q)
    );
  }

  const byDate: Record<string, Transaction[]> = {};
  for (const t of filtered) (byDate[t.date] ??= []).push(t);
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-MY", {
      weekday: "short", day: "numeric", month: "short",
    });
  }

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by description or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />

      {/* Category filter + CSV export */}
      <div className="mb-5 flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
        >
          <option value="all">All categories</option>
          {usedCatIds.map((id) => (
            <option key={id} value={String(id)}>{catPath(id)}</option>
          ))}
        </select>
        <button
          onClick={exportCSV}
          className="rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-400 ring-1 ring-gray-700 hover:text-gray-200"
          title="Export as CSV"
        >
          ↓ CSV
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="text-3xl">🗒️</p>
          <p className="text-sm font-medium text-gray-400">
            {search || filter !== "all" ? "No matching transactions" : "No transactions this month"}
          </p>
          <p className="text-xs text-gray-600">
            {search || filter !== "all" ? "Try a different filter or search term" : "Tap + to record your first one"}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {dates.map((date) => (
          <div key={date}>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {fmtDate(date)}
              </p>
              {date === todayStr && (
                <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Today</span>
              )}
            </div>
            <div className="overflow-hidden rounded-xl bg-gray-900">
              {byDate[date].map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-gray-800" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-300">{catPath(t.category_id)}</p>
                    {t.description && (
                      <p className="truncate text-xs text-gray-500">{t.description}</p>
                    )}
                  </div>

                  <span className={`shrink-0 text-sm font-medium ${isIncome(t.category_id) ? "text-emerald-400" : "text-red-400"}`}>
                    {isIncome(t.category_id) ? "+" : "-"}{fmtRM(t.amount)}
                  </span>

                  {confirmId === t.id ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="rounded bg-red-700 px-2 py-1 text-xs hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting === t.id ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="px-1 text-gray-600 hover:text-indigo-400"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setConfirmId(t.id)}
                        className="px-1 text-gray-600 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6">
            <h2 className="mb-4 text-base font-semibold">Edit Transaction</h2>

            <div className="flex flex-col gap-3">
              <select
                value={editFields.categoryId}
                onChange={(e) => setEditFields((f) => ({ ...f, categoryId: e.target.value }))}
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              >
                {leaves.map((leaf) => (
                  <option key={leaf.id} value={leaf.id}>{catPath(leaf.id)}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 ring-1 ring-gray-700 focus-within:ring-indigo-500">
                <span className="text-sm text-gray-500">RM</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editFields.amount}
                  onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Description (optional)"
                value={editFields.description}
                onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              />

              <input
                type="date"
                value={editFields.date}
                onChange={(e) => setEditFields((f) => ({ ...f, date: e.target.value }))}
                className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditingTx(null)}
                className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

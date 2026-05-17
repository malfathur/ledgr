"use client";

import { useState, useEffect } from "react";
import type { Commitment } from "@/lib/commitments";
import type { Category } from "@/lib/categories";
import { fmtRM } from "@/lib/fmt";

type Props = {
  initialCommitments: Commitment[];
  categories: Category[];
  budgetMap: Record<number, number>;
};

type FormState = { category_id: number | null; amount: string; due_date: string };
const emptyForm: FormState = { category_id: null, amount: "", due_date: "" };

const inputCls = "rounded bg-gray-800 px-2 py-1 text-xs text-gray-100 outline-none ring-1 ring-gray-700 focus:ring-indigo-500";

function dayFromDate(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10);
}

function dateForDay(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-${String(day).padStart(2, "0")}`;
}

export default function SetupCommitments({ initialCommitments, categories, budgetMap }: Props) {
  const [commitments, setCommitments] = useState<Commitment[]>(initialCommitments);
  useEffect(() => { setCommitments(initialCommitments); }, [initialCommitments]);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ amount: string; due_date: string }>({ amount: "", due_date: "" });
  const [busy, setBusy] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leafCategories = categories.filter(
    (c) => !categories.some((other) => other.parent_id === c.id)
  );

  const selectedCat = addForm.category_id
    ? categories.find((c) => c.id === addForm.category_id)
    : null;

  function handleCategorySelect(catId: string) {
    const id = Number(catId);
    if (!id) {
      setAddForm(emptyForm);
      return;
    }
    const amount = budgetMap[id] ?? 0;
    setAddForm({ category_id: id, amount: amount > 0 ? String(amount) : "", due_date: addForm.due_date });
  }

  async function handleAdd() {
    if (!addForm.category_id || !addForm.due_date) return;
    setBusy("add");
    setError(null);
    const res = await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedCat?.name ?? "",
        amount: parseFloat(addForm.amount) || 0,
        due_day: dayFromDate(addForm.due_date),
        category_id: addForm.category_id,
      }),
    });
    if (res.ok) {
      const fresh = await fetch("/api/commitments");
      const { commitments: updated } = await fresh.json();
      setCommitments(updated);
      setAddForm(emptyForm);
      setAdding(false);
    } else {
      setError("Failed to save commitment");
    }
    setBusy(null);
  }

  async function handleEdit(id: number) {
    if (!editForm.due_date) return;
    setBusy(id);
    const due_day = dayFromDate(editForm.due_date);
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editForm.amount) || 0, due_day }),
    });
    setCommitments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, amount: parseFloat(editForm.amount) || 0, due_day } : c
      )
    );
    setEditingId(null);
    setBusy(null);
  }

  async function handleDelete(id: number) {
    setBusy(id);
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
    setCommitments((prev) => prev.filter((c) => c.id !== id));
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {commitments.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40">
                <th className="py-2 pl-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Due</th>
                <th className="py-2 pr-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th className="py-2 pr-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {commitments.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td className="py-2 pl-3 pr-2 text-sm text-gray-300">{c.name}</td>
                    <td className="py-2 pr-2">
                      <input className={`${inputCls} w-32`} type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))} />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-gray-500">RM</span>
                        <input className={`${inputCls} w-20 text-right`} type="number" min={0} step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} />
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(c.id)} disabled={!!busy}
                          className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="group">
                    <td className="py-2.5 pl-3 text-sm text-gray-300">{c.name}</td>
                    <td className="py-2.5 text-sm text-gray-400">Day {c.due_day}</td>
                    <td className="py-2.5 pr-3 text-right text-sm text-gray-300">{fmtRM(c.amount)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditForm({ amount: String(c.amount), due_date: dateForDay(c.due_day) });
                          }}
                          disabled={!!busy}
                          className="text-xs text-gray-400 hover:text-gray-200 disabled:opacity-50"
                        >Edit</button>
                        <button onClick={() => handleDelete(c.id)} disabled={!!busy}
                          className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {commitments.length === 0 && !adding && (
        <p className="text-xs text-gray-600">No commitments yet.</p>
      )}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700 p-3">
          <select
            className={`${inputCls} w-full`}
            value={addForm.category_id ?? ""}
            onChange={(e) => handleCategorySelect(e.target.value)}
            autoFocus
          >
            <option value="">— Select category —</option>
            {leafCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-1 rounded bg-gray-800 px-2 ring-1 ring-gray-700 focus-within:ring-indigo-500">
              <span className="text-xs text-gray-500">RM</span>
              <input
                className="flex-1 bg-transparent py-1 text-xs text-gray-100 outline-none"
                type="number"
                placeholder="0.00"
                min={0}
                step="0.01"
                value={addForm.amount}
                onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <input
              className={`${inputCls} w-36`}
              type="date"
              value={addForm.due_date}
              onChange={(e) => setAddForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!!busy || !addForm.category_id || !addForm.due_date}
              className="flex-1 rounded bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy === "add" ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setAdding(false); setAddForm(emptyForm); }}
              className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="self-start text-xs text-indigo-400 hover:text-indigo-300">
          + Add Commitment
        </button>
      )}
    </div>
  );
}

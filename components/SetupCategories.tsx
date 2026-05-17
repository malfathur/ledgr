"use client";

import { useState } from "react";
import type { Category } from "@/lib/categories";

type Props = {
  initialCategories: Category[];
  isAdmin: boolean;
};

type GroupNode = {
  parent: Category;
  leaves: Category[];
};

function buildGroups(categories: Category[]): GroupNode[] {
  const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);
  const isLeaf = (id: number) => childrenOf(id).length === 0;
  const result: GroupNode[] = [];

  const roots = categories.filter((c) => c.parent_id === null);
  for (const root of roots) {
    const level1 = childrenOf(root.id);

    if (level1.length === 0) {
      result.push({ parent: root, leaves: [] });
      continue;
    }

    const directLeaves = level1.filter((c) => isLeaf(c.id));
    if (directLeaves.length > 0) {
      result.push({ parent: root, leaves: directLeaves });
    }

    const groups = level1.filter((c) => !isLeaf(c.id));
    for (const group of groups) {
      result.push({ parent: group, leaves: childrenOf(group.id) });
    }
  }
  return result;
}

export default function SetupCategories({ initialCategories, isAdmin }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = buildGroups(categories);

  async function handleAdd(parentId: number) {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), parentId }),
    });
    if (res.ok) {
      const fresh = await fetch("/api/categories");
      const { categories: updated } = await fresh.json();
      setCategories(updated);
      setNewName("");
      setAddingTo(null);
    } else {
      const { error: msg } = await res.json();
      setError(msg ?? "Failed to add");
    }
    setBusy(false);
  }

  async function handleDelete(id: number) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      const { error: msg } = await res.json();
      setError(msg ?? "Cannot delete");
    }
    setBusy(false);
  }

  const inputCls = "rounded bg-gray-800 px-2 py-1 text-xs text-gray-100 outline-none ring-1 ring-gray-700 focus:ring-indigo-500";

  return (
    <div className="flex flex-col gap-1">
      {error && (
        <p className="mb-2 rounded bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {groups.map(({ parent, leaves }) => (
        <div key={parent.id} className="rounded-lg border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-800/60 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {parent.name}
            </p>
            {isAdmin && addingTo !== parent.id && (
              <button
                onClick={() => { setAddingTo(parent.id); setNewName(""); setError(null); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300"
              >
                + Add
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-800/60">
            {leaves.map((leaf) => (
              <div key={leaf.id} className="group flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-300">{leaf.name}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(leaf.id)}
                    disabled={busy}
                    className="text-[10px] text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}

            {leaves.length === 0 && addingTo !== parent.id && (
              <p className="px-3 py-2 text-xs text-gray-700">No categories yet</p>
            )}
          </div>

          {isAdmin && addingTo === parent.id && (
            <div className="flex items-center gap-2 border-t border-gray-800 px-3 py-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(parent.id); if (e.key === "Escape") setAddingTo(null); }}
                autoFocus
              />
              <button
                onClick={() => handleAdd(parent.id)}
                disabled={busy || !newName.trim()}
                className="rounded bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {busy ? "…" : "Save"}
              </button>
              <button
                onClick={() => setAddingTo(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

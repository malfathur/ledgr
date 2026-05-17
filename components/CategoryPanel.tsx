"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/summary";
import type { Transaction } from "@/lib/transactions";
import { fmtRM } from "@/lib/fmt";

type Props = {
  node: CategoryNode | null;
  transactions: Transaction[];
  onClose: () => void;
};

function getLeafIds(node: CategoryNode): number[] {
  if (node.children.length === 0) return [node.id];
  return node.children.flatMap(getLeafIds);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-MY", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function CategoryPanel({ node, transactions, onClose }: Props) {
  const isOpen = node !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const leafIds = node ? getLeafIds(node) : [];
  const filtered = transactions.filter((t) => leafIds.includes(t.category_id));

  const byDate: Record<string, Transaction[]> = {};
  for (const t of filtered) (byDate[t.date] ??= []).push(t);
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-gray-950 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <p className="font-semibold text-gray-100">{node?.name ?? ""}</p>
            <p className="text-xs text-gray-500">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
              {node && (
                <span className={node.type === "income" ? "text-emerald-400" : "text-red-400"}>
                  {" · "}{node.type === "income" ? "+" : "−"}{fmtRM(node.actual)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {node && (
              <Link
                href={`/add?category=${node.slug}`}
                onClick={onClose}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + Add
              </Link>
            )}
            <button onClick={onClose} className="text-lg text-gray-500 hover:text-gray-300">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filtered.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <p className="text-2xl">💸</p>
              <p className="text-sm text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-600">Tap + to add one</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {dates.map((date) => (
                <div key={date}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {fmtDate(date)}
                  </p>
                  <div className="overflow-hidden rounded-xl bg-gray-900">
                    {byDate[date].map((t, i) => (
                      <div
                        key={t.id}
                        className={`px-4 py-3 ${i > 0 ? "border-t border-gray-800" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{t.category_name}</span>
                          <span className={`text-sm font-medium ${node?.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                            {node?.type === "income" ? "+" : "−"}{fmtRM(t.amount)}
                          </span>
                        </div>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

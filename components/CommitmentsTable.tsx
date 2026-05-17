"use client";

import { useState } from "react";
import type { Commitment } from "@/lib/commitments";
import { fmtRM } from "@/lib/fmt";

type Props = {
  initialCommitments: Commitment[];
  initialPaidIds: number[];
};

function getDueStatus(dueDay: number, paid: boolean): "paid" | "overdue" | "soon" | "ok" {
  if (paid) return "paid";
  const today = new Date().getDate();
  if (dueDay < today) return "overdue";
  if (dueDay - today <= 3) return "soon";
  return "ok";
}

function DueLabel({ day, paid }: { day: number; paid: boolean }) {
  const status = getDueStatus(day, paid);
  const color =
    status === "paid"    ? "text-emerald-400" :
    status === "overdue" ? "text-red-400" :
    status === "soon"    ? "text-amber-400" :
                           "text-gray-400";
  return <span className={`text-xs tabular-nums ${color}`}>Day {day}</span>;
}

export default function CommitmentsTable({ initialCommitments, initialPaidIds }: Props) {
  const [commitments] = useState<Commitment[]>(initialCommitments);
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set(initialPaidIds));
  const [busy, setBusy] = useState<number | null>(null);

  async function handlePay(id: number) {
    setBusy(id);
    const res = await fetch(`/api/commitments/${id}/pay`, { method: "POST" });
    if (res.ok) setPaidIds((prev) => new Set([...prev, id]));
    setBusy(null);
  }

  return (
    <div className="flex h-full flex-col gap-3">

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Commitments
      </p>

      {commitments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-600">No commitments set up.</p>
            <a href="/setup" className="mt-1 block text-xs text-indigo-400 hover:text-indigo-300">
              Add in Setup →
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Due</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th className="pb-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {commitments.map((c) => {
                const isPaid = paidIds.has(c.id);
                return (
                  <tr key={c.id} className={isPaid ? "opacity-50" : ""}>
                    <td className="py-2.5 text-sm text-gray-300">
                      {isPaid && <span className="mr-1 text-emerald-400">✓</span>}
                      {c.name}
                    </td>
                    <td className="py-2.5"><DueLabel day={c.due_day} paid={isPaid} /></td>
                    <td className="py-2.5 text-right text-sm text-gray-300">{fmtRM(c.amount)}</td>
                    <td className="py-2.5 text-right">
                      {!isPaid && (
                        <button
                          onClick={() => handlePay(c.id)}
                          disabled={busy === c.id}
                          className="rounded bg-emerald-700/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-700/60 disabled:opacity-50"
                        >
                          {busy === c.id ? "…" : "Paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

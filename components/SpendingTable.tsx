"use client";

import { useState } from "react";
import { fmtRM } from "@/lib/fmt";

type NodeData = {
  id: number;
  name: string;
  actual: number;
  expected: number;
  available: number;
};

export type SpendingRow =
  | { kind: "group-header"; node: NodeData; depth: number }
  | { kind: "leaf";         node: NodeData; depth: number }
  | { kind: "subtotal";     node: NodeData; depth: number };

function remainingColor(n: number) {
  if (n < 0) return "text-red-400";
  if (n === 0) return "text-gray-400";
  return "text-emerald-400";
}

function pctColors(pct: number) {
  if (pct > 100) return { pill: "bg-red-900/60 text-red-400",    bar: "bg-red-500" };
  if (pct >= 80)  return { pill: "bg-amber-900/60 text-amber-400", bar: "bg-amber-500" };
  return              { pill: "bg-emerald-900/40 text-emerald-400", bar: "bg-emerald-600" };
}

export default function SpendingTable({ rows }: { rows: SpendingRow[] }) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Determine row visibility based on collapsed groups
  const stack: number[] = [];
  const processed: { row: SpendingRow; visible: boolean }[] = [];

  for (const row of rows) {
    if (row.kind === "group-header") {
      processed.push({ row, visible: stack.length === 0 });
      if (collapsed.has(row.node.id)) stack.push(row.node.id);
    } else if (row.kind === "subtotal") {
      if (stack[stack.length - 1] === row.node.id) {
        stack.pop();
        processed.push({ row, visible: false });
      } else {
        processed.push({ row, visible: stack.length === 0 });
      }
    } else {
      processed.push({ row, visible: stack.length === 0 });
    }
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-gray-900">
        <tr className="border-b border-gray-800 text-xs text-gray-500">
          <th className="py-2 pl-4 text-left font-medium">Category</th>
          <th className="py-2 pr-3 text-right font-medium">Budgeted</th>
          <th className="py-2 pr-3 text-right font-medium">Spent</th>
          <th className="py-2 pr-4 text-right font-medium">Left</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {processed.map(({ row, visible }, i) => {
          if (!visible) return null;

          if (row.kind === "group-header") {
            const isCollapsed = collapsed.has(row.node.id);
            return (
              <tr
                key={i}
                className="cursor-pointer select-none bg-gray-800/40 hover:bg-gray-800/60"
                onClick={() => toggle(row.node.id)}
              >
                <td
                  className="py-2 font-semibold text-gray-200"
                  style={{ paddingLeft: `${row.depth * 12 + 16}px` }}
                >
                  <span className="mr-2 text-[10px] text-gray-500">
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  {row.node.name}
                </td>
                {isCollapsed ? (
                  <>
                    <td className="py-2 pr-3 text-right text-xs text-gray-500">{fmtRM(row.node.expected)}</td>
                    <td className="py-2 pr-3 text-right text-xs text-gray-400">{fmtRM(row.node.actual)}</td>
                    <td className={`py-2 pr-4 text-right text-xs font-semibold ${remainingColor(row.node.available)}`}>
                      {row.node.available < 0 ? "−" : ""}{fmtRM(Math.abs(row.node.available))}
                    </td>
                  </>
                ) : (
                  <td colSpan={3} />
                )}
              </tr>
            );
          }

          if (row.kind === "subtotal") {
            return (
              <tr key={i} className="border-t border-gray-700 bg-gray-800/60">
                <td
                  className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
                  style={{ paddingLeft: `${row.depth * 12 + 16}px` }}
                >
                  {row.node.name} total
                </td>
                <td className="py-2 pr-3 text-right text-gray-400">{fmtRM(row.node.expected)}</td>
                <td className="py-2 pr-3 text-right text-gray-400">{fmtRM(row.node.actual)}</td>
                <td className={`py-2 pr-4 text-right font-semibold ${remainingColor(row.node.available)}`}>
                  {row.node.available < 0 ? "−" : ""}{fmtRM(Math.abs(row.node.available))}
                </td>
              </tr>
            );
          }

          // leaf
          const pct = row.node.expected > 0 ? (row.node.actual / row.node.expected) * 100 : 0;
          const colors = pctColors(pct);

          return (
            <tr key={i} className="hover:bg-gray-800/30">
              <td
                className="relative py-2.5 text-gray-300"
                style={{ paddingLeft: `${row.depth * 12 + 16}px` }}
              >
                {row.node.name}
                {row.node.expected > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
                    <div className={`h-full ${colors.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                )}
              </td>
              <td className="py-2.5 pr-3 text-right text-gray-500">
                {row.node.expected > 0 ? fmtRM(row.node.expected) : <span className="text-gray-700">—</span>}
              </td>
              <td className="py-2.5 pr-3 text-right">
                <span className="text-gray-400">{fmtRM(row.node.actual)}</span>
                {row.node.expected > 0 && (
                  <span className={`ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium ${colors.pill}`}>
                    {Math.round(pct)}%
                  </span>
                )}
              </td>
              <td className={`py-2.5 pr-4 text-right ${remainingColor(row.node.available)}`}>
                {row.node.expected > 0
                  ? <>{row.node.available < 0 ? "−" : ""}{fmtRM(Math.abs(row.node.available))}</>
                  : <span className="text-gray-700">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

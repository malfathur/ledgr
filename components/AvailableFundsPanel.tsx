"use client";

import { useState, useEffect } from "react";
import { fmtRM } from "@/lib/fmt";
import type { CategoryNode } from "@/lib/summary";

const VB   = 200;
const CX   = 100;
const CY   = 100;
const R    = 80;
const SW   = 26;
const CIRC = 2 * Math.PI * R;
const GAP  = 3;

const COLORS = [
  "#e879f9", // fuchsia
  "#818cf8", // indigo
  "#38bdf8", // sky
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f472b6", // pink
  "#a78bfa", // violet
];

type Props = {
  totalIncome: number;
  totalSpending: number;
  expenseNodes: CategoryNode[];
};

export default function AvailableFundsPanel({ totalIncome, totalSpending, expenseNodes }: Props) {
  const [mode, setMode]       = useState<"overview" | "breakdown">("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const availableFunds = totalIncome - totalSpending;
  const isEmpty        = totalIncome === 0 && totalSpending === 0;
  const isBreakdown    = mode === "breakdown";

  // Overview
  const fraction  = isEmpty ? 0 : totalIncome > 0 ? Math.min(totalSpending / totalIncome, 1) : 1;
  const spentLen  = fraction * CIRC;
  const availLen  = CIRC - spentLen;
  const availColor = availableFunds >= 0 ? "#34d399" : "#fb7185";

  // Breakdown
  const topExpenses = expenseNodes
    .filter((n) => n.actual > 0)
    .sort((a, b) => b.actual - a.actual);
  const totalSpent = topExpenses.reduce((s, n) => s + n.actual, 0);

  let cum = 0;
  const breakdownArcs = topExpenses.map((n, i) => {
    const full    = totalSpent > 0 ? (n.actual / totalSpent) * CIRC : 0;
    const display = Math.max(full - GAP, 0);
    const offset  = cum;
    cum += full;
    return { ...n, full, display, offset, color: COLORS[i % COLORS.length] };
  });

  const canBreakdown = topExpenses.length > 0;

  return (
    <div
      className="flex h-full flex-col"
      onClick={() => canBreakdown && setMode((m) => m === "overview" ? "breakdown" : "overview")}
      style={{ cursor: canBreakdown ? "pointer" : "default" }}
    >
      {/* SVG */}
      <div className="relative min-h-0 flex-1">
        <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" style={{ display: "block" }}>

          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1f2937" strokeWidth={SW} />

          {/* Overview arcs */}
          <g style={{ transition: "opacity 400ms ease", opacity: isBreakdown ? 0 : 1 }}>
            {!isEmpty && availLen > 0 && (
              <circle
                cx={CX} cy={CY} r={R} fill="none"
                stroke={availColor} strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${mounted ? availLen : 0} ${CIRC}`}
                strokeDashoffset={-spentLen}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 1000ms cubic-bezier(0.4,0,0.2,1)" }}
              />
            )}
            {!isEmpty && spentLen > 0 && (
              <circle
                cx={CX} cy={CY} r={R} fill="none"
                stroke="#f43f5e" strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${mounted ? spentLen : 0} ${CIRC}`}
                strokeDashoffset={0}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 1000ms cubic-bezier(0.4,0,0.2,1)" }}
              />
            )}
          </g>

          {/* Breakdown arcs — full length, stagger by opacity */}
          <g style={{ transition: "opacity 400ms ease", opacity: isBreakdown ? 1 : 0 }}>
            {breakdownArcs.map((arc, i) => (
              <circle
                key={arc.id}
                cx={CX} cy={CY} r={R} fill="none"
                stroke={arc.color} strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${arc.display} ${CIRC}`}
                strokeDashoffset={-arc.offset}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  opacity: isBreakdown ? 1 : 0,
                  transition: `opacity 300ms ease ${i * 60}ms`,
                }}
              />
            ))}
          </g>

        </svg>

        {/* Centre label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {isEmpty ? (
            <span className="text-xs text-gray-600">No data</span>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-widest text-gray-500">
                {isBreakdown ? "spent" : "available"}
              </span>
              <span
                className={`text-lg font-semibold tabular-nums ${
                  isBreakdown
                    ? "text-white"
                    : availableFunds >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
                style={{ transition: "color 300ms ease" }}
              >
                {isBreakdown
                  ? fmtRM(totalSpending)
                  : `${availableFunds < 0 ? "−" : ""}${fmtRM(Math.abs(availableFunds))}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          transition: "max-height 400ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease",
          maxHeight: isBreakdown ? "96px" : "0px",
          opacity: isBreakdown ? 1 : 0,
          overflow: "hidden",
        }}
        className="shrink-0"
      >
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-1 pb-1 pt-1">
          {breakdownArcs.map((arc) => (
            <li key={arc.id} className="flex min-w-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: arc.color }} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[10px] text-gray-400">{arc.name}</span>
                <span className="text-[10px] font-medium text-gray-200">{fmtRM(arc.actual)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Hint */}
      {!isEmpty && canBreakdown && (
        <p
          style={{ transition: "opacity 250ms ease", opacity: isBreakdown ? 0 : 0.3 }}
          className="shrink-0 pb-0.5 text-center text-[9px] tracking-wide text-gray-500"
        >
          tap to break down
        </p>
      )}
    </div>
  );
}

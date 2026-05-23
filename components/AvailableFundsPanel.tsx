"use client";

import { useState, useEffect } from "react";
import { fmtRM } from "@/lib/fmt";
import type { CategoryNode } from "@/lib/summary";
import type { Transaction } from "@/lib/transactions";

// Donut constants
const VB   = 200;
const CX   = 100;
const CY   = 100;
const R    = 80;
const SW   = 26;
const CIRC = 2 * Math.PI * R;
const GAP  = 3;

// Chart viewport
// CL/CR balanced so plot centre ≈ SVG centre (plot centre = CL + CHART_W/2 = CVB_W/2)
// CVB_W = CL + CHART_W + CR; with CL=22, CR=14 → plot centre = 22+82=104 ≈ 104 = 208/2
const CL = 22, CR = 14, CT = 10, CB = 14;
const CVB_W = 208, CVB_H = 78;
const CHART_W = CVB_W - CL - CR;  // 172
const CHART_H = CVB_H - CT - CB;  // 54

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLORS = [
  "#e879f9", "#818cf8", "#38bdf8", "#34d399",
  "#fbbf24", "#fb923c", "#f472b6", "#a78bfa",
];

// ── Nice-number axis algorithm (Heckbert 1990) ─────────────────
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const f   = raw / Math.pow(10, exp);
  let nice: number;
  if      (f < 1.5) nice = 1;
  else if (f < 3)   nice = 2;
  else if (f < 7)   nice = 5;
  else              nice = 10;
  return nice * Math.pow(10, exp);
}

function niceTicks(dataMin: number, dataMax: number, targetCount = 5): number[] {
  if (dataMax <= 0) return [0];
  const rawStep  = (dataMax - dataMin) / Math.max(targetCount - 1, 1);
  const step     = niceStep(rawStep);
  const niceMin  = Math.floor(dataMin / step) * step;
  const niceMax  = Math.ceil(dataMax / step) * step;
  const ticks: number[] = [];
  for (
    let v = niceMin;
    v <= niceMax + step * 1e-9;
    v = Math.round((v + step) * 1e12) / 1e12
  ) {
    ticks.push(v);
  }
  return ticks;
}

// Consistent axis label format — units stay the same across all ticks
function fmtAxisVal(v: number, maxTick: number): string {
  if (v === 0) return "0";
  if (maxTick >= 10000) return `${(v / 1000).toFixed(0)}k`;
  if (maxTick >= 1000)  return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return v.toFixed(0);
}

type Props = {
  totalIncome: number;
  totalSpending: number;
  expenseNodes: CategoryNode[];
  transactions: Transaction[];
  month: number;
  year: number;
};

type Point = { day: number; cum: number };

export default function AvailableFundsPanel({
  totalIncome,
  totalSpending,
  expenseNodes,
  transactions,
  month,
  year,
}: Props) {
  const [mode, setMode]                 = useState<"overview" | "breakdown">("overview");
  const [mounted, setMounted]           = useState(false);
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());
  const [subView, setSubView]           = useState<"list" | "chart">("list");

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleDonutClick() {
    if (!canBreakdown) return;
    setMode((m) => {
      if (m === "breakdown") setSubView("list");
      return m === "overview" ? "breakdown" : "overview";
    });
  }

  function toggleGroup(id: number) {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const availableFunds = totalIncome - totalSpending;
  const isEmpty        = totalIncome === 0 && totalSpending === 0;
  const isBreakdown    = mode === "breakdown";

  // ── Donut ──────────────────────────────────────────────────
  const fraction   = isEmpty ? 0 : totalIncome > 0 ? Math.min(totalSpending / totalIncome, 1) : 1;
  const spentLen   = fraction * CIRC;
  const availLen   = CIRC - spentLen;
  const availColor = availableFunds >= 0 ? "#34d399" : "#fb7185";

  const sortedNodes = [...expenseNodes].sort((a, b) => b.actual - a.actual);
  const totalSpent  = sortedNodes.reduce((s, n) => s + n.actual, 0);

  const colorMap: Record<number, string> = {};
  let colorIdx = 0;
  for (const nd of sortedNodes) {
    if (nd.actual > 0) colorMap[nd.id] = COLORS[colorIdx++ % COLORS.length];
  }

  let arcCum = 0;
  const breakdownArcs = sortedNodes
    .filter((nd) => nd.actual > 0)
    .map((nd) => {
      const full    = totalSpent > 0 ? (nd.actual / totalSpent) * CIRC : 0;
      const display = Math.max(full - GAP, 0);
      const offset  = arcCum;
      arcCum += full;
      return { ...nd, full, display, offset, color: colorMap[nd.id] };
    });

  const listItems    = sortedNodes;
  const canBreakdown = expenseNodes.length > 0;

  const labelTop   = isBreakdown ? "SPENT" : "AVAILABLE";
  const labelVal   = isBreakdown
    ? fmtRM(totalSpending)
    : `${availableFunds < 0 ? "−" : ""}${fmtRM(Math.abs(availableFunds))}`;
  const labelColor = isBreakdown ? "#ffffff" : availableFunds >= 0 ? "#34d399" : "#fb7185";

  // ── Chart data ──────────────────────────────────────────────
  const daysInMonth    = new Date(year, month, 0).getDate();
  const now            = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayDay       = isCurrentMonth ? now.getDate() : daysInMonth;

  const expenseGroupIds = new Set(expenseNodes.map((nd) => nd.id));

  const groupDailySpend: Record<number, Record<number, number>> = {};
  for (const t of transactions) {
    if (!t.parent_id || !expenseGroupIds.has(t.parent_id)) continue;
    const day = parseInt(t.date.split("-")[2], 10);
    if (!groupDailySpend[t.parent_id]) groupDailySpend[t.parent_id] = {};
    groupDailySpend[t.parent_id][day] =
      (groupDailySpend[t.parent_id][day] ?? 0) + t.amount;
  }

  const seriesMap: Record<number, Point[]> = {};
  let maxCum = 0;
  for (const group of expenseNodes) {
    if (!colorMap[group.id]) continue;
    const daily = groupDailySpend[group.id] ?? {};
    const points: Point[] = [];
    let c = 0;
    for (let d = 1; d <= todayDay; d++) {
      c += daily[d] ?? 0;
      points.push({ day: d, cum: c });
    }
    if (c > 0) {
      seriesMap[group.id] = points;
      if (c > maxCum) maxCum = c;
    }
  }

  const hasChartData  = Object.keys(seriesMap).length > 0;
  const visibleSeries = Object.entries(seriesMap).filter(
    ([gid]) => !hiddenGroups.has(parseInt(gid, 10))
  );

  // ── Axis ticks (nice numbers) ─────────────────────────────
  // Y — scale to the max of currently VISIBLE series so hiding a line rescales the axis
  const visibleMaxCum = visibleSeries.reduce(
    (m, [, pts]) => Math.max(m, pts[pts.length - 1]?.cum ?? 0),
    0
  );
  const yTickValues  = niceTicks(0, visibleMaxCum > 0 ? visibleMaxCum : maxCum > 0 ? maxCum : 100, 5);
  const chartMax     = yTickValues[yTickValues.length - 1];
  const maxTickLabel = chartMax;

  // X — integer days, nice spacing
  const xTickRaw  = niceTicks(1, daysInMonth, 6).map(Math.round);
  // Deduplicate, clamp to [1, daysInMonth], ensure endpoints
  const xTickSet  = new Set([1, ...xTickRaw.filter((d) => d >= 1 && d <= daysInMonth), daysInMonth]);
  const xTickDays = [...xTickSet].sort((a, b) => a - b);

  // ── Coordinate helpers (use chartMax, not maxCum) ─────────
  function xOf(day: number) {
    return CL + ((day - 1) / Math.max(daysInMonth - 1, 1)) * CHART_W;
  }
  function yOf(v: number) {
    return CT + (1 - v / chartMax) * CHART_H;
  }

  // Smooth bezier path (midpoint control points — good for monotone cumulative data)
  function linePath(pts: Point[]): string {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${xOf(pts[0].day).toFixed(1)} ${yOf(pts[0].cum).toFixed(1)}`;
    let d = `M ${xOf(pts[0].day).toFixed(1)} ${yOf(pts[0].cum).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const x0 = xOf(pts[i - 1].day), y0 = yOf(pts[i - 1].cum);
      const x1 = xOf(pts[i].day),     y1 = yOf(pts[i].cum);
      const mx = ((x0 + x1) / 2).toFixed(1);
      d += ` C ${mx} ${y0.toFixed(1)}, ${mx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return d;
  }

  function areaPath(pts: Point[]): string {
    if (pts.length === 0) return "";
    const base   = yOf(0).toFixed(1);
    const firstX = xOf(pts[0].day).toFixed(1);
    const lastX  = xOf(pts[pts.length - 1].day).toFixed(1);
    return `${linePath(pts)} L ${lastX} ${base} L ${firstX} ${base} Z`;
  }

  const todayX    = xOf(todayDay);
  const baselineY = yOf(0);
  const monthLabel = `${MONTHS_SHORT[month - 1]} ${year}`;

  const EASE = "450ms cubic-bezier(0.4,0,0.2,1)";

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* ── Donut ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 top-0"
        style={{
          width: isBreakdown ? "33.333%" : "100%",
          transition: `width ${EASE}`,
          willChange: "width",
          cursor: canBreakdown ? "pointer" : "default",
        }}
        onClick={handleDonutClick}
      >
        <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" style={{ display: "block" }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1f2937" strokeWidth={SW} />

          <g style={{ transition: "opacity 400ms ease", opacity: isBreakdown ? 0 : 1 }}>
            {!isEmpty && availLen > 0 && (
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke={availColor} strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${mounted ? availLen : 0} ${CIRC}`}
                strokeDashoffset={-spentLen}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 1000ms cubic-bezier(0.4,0,0.2,1)" }}
              />
            )}
            {!isEmpty && spentLen > 0 && (
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="#f43f5e" strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${mounted ? spentLen : 0} ${CIRC}`}
                strokeDashoffset={0}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dasharray 1000ms cubic-bezier(0.4,0,0.2,1)" }}
              />
            )}
          </g>

          <g style={{ transition: "opacity 400ms ease", opacity: isBreakdown ? 1 : 0 }}>
            {breakdownArcs.map((arc, i) => (
              <circle key={arc.id} cx={CX} cy={CY} r={R} fill="none"
                stroke={arc.color} strokeWidth={SW} strokeLinecap="butt"
                strokeDasharray={`${arc.display} ${CIRC}`}
                strokeDashoffset={-arc.offset}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ opacity: isBreakdown ? 1 : 0, transition: `opacity 300ms ease ${i * 60}ms` }}
              />
            ))}
          </g>

          {isEmpty ? (
            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#4b5563">
              No data
            </text>
          ) : (
            <>
              <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="7.5" fill="#6b7280" letterSpacing="2">
                {labelTop}
              </text>
              <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="600" fill={labelColor}
                style={{ transition: "fill 300ms ease" }}>
                {labelVal}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* ── Right panel ───────────────────────────────────── */}
      <div
        className="absolute bottom-0 right-0 top-0 flex flex-col overflow-hidden"
        style={{
          width: "66.666%",
          transform: isBreakdown ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${EASE}, opacity 300ms ease`,
          opacity: isBreakdown ? 1 : 0,
          willChange: "transform, opacity",
          pointerEvents: isBreakdown ? "auto" : "none",
        }}
      >
        {/* List sub-view */}
        {subView === "list" && (
          <>
            <div
              className="flex-1 flex items-center overflow-y-auto py-2"
              style={{ paddingLeft: "29px", paddingRight: "29px" }}
            >
            <div
              className="w-full rounded-lg p-3"
              style={{
                background: "#1e293b",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
<ul
              className="grid grid-cols-2 gap-x-6 gap-y-2"
            >
              {listItems.map((item) => {
                const color    = colorMap[item.id];
                const hasSpend = item.actual > 0;
                const hidden   = hiddenGroups.has(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex min-w-0 items-center gap-2 rounded transition-opacity"
                    style={{ cursor: hasSpend ? "pointer" : "default", opacity: hasSpend && hidden ? 0.3 : 1 }}
                    onClick={() => hasSpend && toggleGroup(item.id)}
                  >
                    <span
                      className="shrink-0 rounded-full transition-all"
                      style={{
                        background: hasSpend && !hidden ? color : "transparent",
                        border: `1.5px solid ${hasSpend ? color : "#374151"}`,
                        width: 8,
                        height: 8,
                      }}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate" style={{ fontSize: 11, color: hasSpend ? "#9ca3af" : "#4b5563" }}>
                        {item.name}
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          fontSize: 12,
                          color: hasSpend ? "#e5e7eb" : "#6b7280",
                          textDecoration: hidden ? "line-through" : "none",
                        }}
                      >
                        {fmtRM(item.actual)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            </div>
            </div>
            <div className="shrink-0 flex justify-center py-2" style={{ paddingLeft: "29px", paddingRight: "29px" }}>
              <button
                onClick={() => setSubView("chart")}
                disabled={!hasChartData}
                className="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: hasChartData ? "#1e293b" : "#0f172a",
                  color: hasChartData ? "#94a3b8" : "#374151",
                  cursor: hasChartData ? "pointer" : "not-allowed",
                  border: "1px solid #334155",
                }}
              >
                Spend Trend
              </button>
            </div>
          </>
        )}

        {/* Chart sub-view */}
        {subView === "chart" && (
          <>
            {/* Compact legend — click to toggle series */}
            <div className="shrink-0 flex flex-wrap gap-x-3 gap-y-0.5 pl-4 pr-2 pt-1.5 pb-0.5">
              {listItems.map((item) => {
                const color    = colorMap[item.id];
                const hasSpend = item.actual > 0;
                const hidden   = hiddenGroups.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => hasSpend && toggleGroup(item.id)}
                    className="flex items-center gap-1 transition-opacity"
                    style={{
                      opacity: hasSpend ? (hidden ? 0.3 : 1) : 0.35,
                      cursor: hasSpend ? "pointer" : "default",
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    <span
                      className="shrink-0 rounded-full transition-all"
                      style={{
                        background: hasSpend && !hidden ? color : "transparent",
                        border: `1.5px solid ${hasSpend ? color : "#374151"}`,
                        width: 6,
                        height: 6,
                      }}
                    />
                    <span style={{ fontSize: 9, color: hasSpend ? "#9ca3af" : "#4b5563" }}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chart */}
            <div className="flex min-h-0 flex-1 items-center justify-center pl-0 pr-3 py-0">
          <svg
            viewBox={`0 0 ${CVB_W} ${CVB_H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              {Object.keys(seriesMap).map((gid) => {
                const color = colorMap[parseInt(gid, 10)];
                return (
                  <linearGradient key={gid} id={`afp-grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                );
              })}
              <linearGradient id="afp-future" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#0f172a" stopOpacity="0" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* ── Y-axis grid lines + tick marks + labels ── */}
            {yTickValues.map((v) => {
              const y       = yOf(v);
              const isZero  = v === 0;
              return (
                <g key={v}>
                  {/* Grid line across plot */}
                  <line
                    x1={CL} y1={y} x2={CL + CHART_W} y2={y}
                    stroke={isZero ? "#374151" : "#1e293b"}
                    strokeWidth={isZero ? "0.9" : "0.4"}
                    strokeDasharray={isZero ? "none" : "2 3"}
                  />
                  {/* Outward tick mark */}
                  <line
                    x1={CL - 3} y1={y} x2={CL} y2={y}
                    stroke="#374151" strokeWidth="0.7"
                  />
                  {/* Label */}
                  <text
                    x={CL - 5} y={y}
                    textAnchor="end" dominantBaseline="middle"
                    fontSize="5" fill="#6b7280"
                  >
                    {fmtAxisVal(v, maxTickLabel)}
                  </text>
                </g>
              );
            })}

            {/* Y-axis spine */}
            <line
              x1={CL} y1={CT} x2={CL} y2={baselineY}
              stroke="#374151" strokeWidth="0.9"
            />

            {/* Y-axis title (rotated "RM") */}
            <text
              x={5} y={CT + CHART_H / 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="4.5" fill="#4b5563" letterSpacing="0.5"
              transform={`rotate(-90, 5, ${CT + CHART_H / 2})`}
            >
              RM
            </text>

            {/* ── X-axis tick marks + labels ── */}
            {xTickDays.map((d) => {
              const x = xOf(d);
              return (
                <g key={d}>
                  {/* Outward tick */}
                  <line
                    x1={x} y1={baselineY} x2={x} y2={baselineY + 3}
                    stroke="#374151" strokeWidth="0.7"
                  />
                  {/* Label */}
                  <text
                    x={x} y={CVB_H - 5}
                    textAnchor="middle" fontSize="5" fill="#6b7280"
                  >
                    {d}
                  </text>
                </g>
              );
            })}

            {/* X-axis spine */}
            <line
              x1={CL} y1={baselineY} x2={CL + CHART_W} y2={baselineY}
              stroke="#374151" strokeWidth="0.9"
            />

            {/* X-axis title */}
            <text
              x={CL + CHART_W / 2} y={CVB_H - 1}
              textAnchor="middle" fontSize="4.5" fill="#4b5563" letterSpacing="0.5"
            >
              {monthLabel}
            </text>

            {/* Area fills */}
            {visibleSeries.map(([gid, pts]) => (
              <path key={`area-${gid}`} d={areaPath(pts)} fill={`url(#afp-grad-${gid})`} />
            ))}

            {/* Series lines */}
            {visibleSeries.map(([gid, pts]) => {
              const color = colorMap[parseInt(gid, 10)];
              return (
                <path key={`line-${gid}`} d={linePath(pts)} fill="none"
                  stroke={color} strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
                />
              );
            })}

            {/* End-point dots */}
            {visibleSeries.map(([gid, pts]) => {
              const color = colorMap[parseInt(gid, 10)];
              const last  = pts[pts.length - 1];
              return (
                <circle key={`dot-${gid}`}
                  cx={xOf(last.day)} cy={yOf(last.cum)}
                  r="1.8" fill={color} stroke="#0f172a" strokeWidth="0.8"
                />
              );
            })}

            {/* Future overlay */}
            {isCurrentMonth && todayDay < daysInMonth && (
              <rect
                x={todayX} y={CT}
                width={xOf(daysInMonth) - todayX} height={CHART_H}
                fill="url(#afp-future)"
              />
            )}

            {/* Today marker */}
            {isCurrentMonth && (
              <>
                <line
                  x1={todayX} y1={CT} x2={todayX} y2={baselineY}
                  stroke="#4b5563" strokeWidth="0.8" strokeDasharray="2.5 2"
                />
                <text
                  x={todayX} y={CT - 4}
                  textAnchor="middle" fontSize="4.5" fill="#6b7280"
                >
                  today
                </text>
              </>
            )}

            {/* No-data placeholder */}
            {!hasChartData && (
              <text
                x={CL + CHART_W / 2} y={CT + CHART_H / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="#1e293b" letterSpacing="1"
              >
                no spend this month
              </text>
            )}
          </svg>
        </div>

            {/* Back to breakdown */}
            <div className="shrink-0 flex justify-center py-1">
              <button
                onClick={() => setSubView("list")}
                className="text-xs"
                style={{ color: "#4b5563", background: "none", border: "none", cursor: "pointer" }}
              >
                back to breakdown
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

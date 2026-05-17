"use client";

import { useRouter } from "next/navigation";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = { month: number; year: number; basePath?: string };

export default function MonthSelector({ month, year, basePath = "/summary" }: Props) {
  const router = useRouter();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const atCeiling = year > currentYear || (year === currentYear && month >= currentMonth);

  function go(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    if (y > currentYear || (y === currentYear && m > currentMonth)) return;
    router.push(`${basePath}?month=${m}&year=${y}`);
  }

  const atFloor = false;
  const notCurrentMonth = !(year === currentYear && month === currentMonth);

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => go(-1)} className="px-2 py-1 text-gray-400 hover:text-white">‹</button>
      <span className="min-w-[90px] text-center font-medium">{MONTHS[month - 1]} {year}</span>
      {notCurrentMonth && (
        <button
          onClick={() => router.push(`${basePath}?month=${currentMonth}&year=${currentYear}`)}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Now
        </button>
      )}
      <button
        onClick={() => go(1)}
        disabled={atCeiling}
        className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}

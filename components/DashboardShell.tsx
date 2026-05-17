import Link from "next/link";
import TiltCard from "./TiltCard";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = {
  month: number;
  year: number;
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
  nav: React.ReactNode;
};

export default function DashboardShell({
  month,
  year,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  nav,
}: Props) {
  return (
    <div className="flex h-screen flex-col overflow-hidden px-4 pb-4 pt-4">

      {/* ── Top bar ── */}
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-400">{MONTHS[month - 1]} {year}</p>
        </div>
      </div>

      {/* ── 2×2 grid ── */}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
        <TiltCard glowColor="rgba(52,211,153,0.18)"  className="min-h-0 overflow-hidden rounded-xl border-t-2 border-emerald-500/40 bg-gradient-to-br from-gray-900 to-gray-950 p-3">{topLeft}</TiltCard>
        <TiltCard glowColor="rgba(99,102,241,0.18)"  className="min-h-0 overflow-hidden rounded-xl border-t-2 border-indigo-500/40 bg-gradient-to-br from-gray-900 to-gray-950 p-3">{topRight}</TiltCard>
        <TiltCard glowColor="rgba(245,158,11,0.18)"  className="min-h-0 overflow-hidden rounded-xl border-t-2 border-amber-500/40 bg-gradient-to-br from-gray-900 to-gray-950 p-3">{bottomLeft}</TiltCard>
        <TiltCard glowColor="rgba(244,63,94,0.18)"   className="min-h-0 overflow-hidden rounded-xl border-t-2 border-rose-500/40 bg-gradient-to-br from-gray-900 to-gray-950 p-3">{bottomRight}</TiltCard>
      </div>

      {/* ── Nav ── */}
      <div className="mt-3 shrink-0">
        {nav}
      </div>

    </div>
  );
}

import Link from "next/link";

export default function QuickActionsPanel() {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Quick Actions
      </p>

      {/* Primary CTA */}
      <Link
        href="/add"
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <span className="text-base leading-none">+</span>
        Add Transaction
      </Link>

      {/* Spending Breakdown — full width secondary */}
      <Link
        href="/summary"
        className="group flex items-center gap-3 rounded-lg border border-gray-700 px-3 py-2.5 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5"
      >
        <span className="text-lg leading-none">📊</span>
        <p className="text-xs font-medium text-gray-300 group-hover:text-white">Spending Breakdown</p>
      </Link>

      {/* Budget + History */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/budget"
          className="group flex flex-col items-center gap-1 rounded-lg border border-gray-700 py-2.5 transition-colors hover:border-amber-500/50 hover:bg-amber-500/5"
        >
          <span className="text-base leading-none">🎯</span>
          <p className="text-xs font-medium text-gray-400 group-hover:text-amber-300">Budget</p>
        </Link>
        <Link
          href="/history"
          className="group flex flex-col items-center gap-1 rounded-lg border border-gray-700 py-2.5 transition-colors hover:border-sky-500/50 hover:bg-sky-500/5"
        >
          <span className="text-base leading-none">🕐</span>
          <p className="text-xs font-medium text-gray-400 group-hover:text-sky-300">History</p>
        </Link>
      </div>
    </div>
  );
}

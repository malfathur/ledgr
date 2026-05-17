import { fmtRM } from "@/lib/fmt";

type Props = {
  totalIncome: number;
  totalSpending: number;
  totalSavings: number;
};

export default function CashFlowMini({ totalIncome, totalSpending, totalSavings }: Props) {
  const netSavings = totalSavings;
  const usagePct = totalIncome > 0 ? (totalSpending / totalIncome) * 100 : 0;

  const stats = [
    {
      label: "Spent",
      value: fmtRM(totalSpending),
      color: "text-rose-400",
      border: "border-rose-500/50",
    },
    {
      label: "Net Savings",
      value: `${netSavings < 0 ? "−" : ""}${fmtRM(Math.abs(netSavings))}`,
      color: netSavings >= 0 ? "text-emerald-400" : "text-red-400",
      border: netSavings >= 0 ? "border-emerald-500/50" : "border-red-500/50",
    },
    {
      label: "Usage",
      value: `${usagePct.toFixed(1)}%`,
      color: usagePct >= 100 ? "text-red-400" : usagePct >= 80 ? "text-amber-400" : "text-emerald-400",
      border: usagePct >= 100 ? "border-red-500/50" : usagePct >= 80 ? "border-amber-500/50" : "border-emerald-500/50",
    },
  ];

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-gray-800 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Cash Flow
      </p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ label, value, color, border }) => (
          <div key={label} className={`rounded-lg bg-gray-800/60 px-2 py-2 border-l-2 ${border}`}>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-0.5 text-xs font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

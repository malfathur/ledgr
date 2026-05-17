import type { Alert } from "@/lib/alerts";

type Props = {
  alerts: Alert[];
};

const KIND_ICON: Record<string, string> = {
  COMMITMENT_OVERDUE:  "🔴",
  COMMITMENT_DUE_SOON: "🟡",
  BUDGET_EXCEEDED:     "🔴",
  BUDGET_NEAR_LIMIT:   "🟡",
  BUDGET_UNALLOCATED:  "🟡",
};

export default function AlertsPanel({ alerts }: Props) {
  return (
    <div className="flex h-full flex-col gap-3">

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Alerts
        {alerts.length > 0 && (
          <span className="ml-2 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
            {alerts.length}
          </span>
        )}
      </p>

      {alerts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg">✅</p>
            <p className="mt-1 text-xs text-gray-500">All clear — no alerts this month.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col divide-y divide-gray-800 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-2.5 py-2.5 ${
                alert.severity === "critical" ? "opacity-100" : "opacity-80"
              }`}
            >
              <span className="mt-0.5 shrink-0 text-sm">{KIND_ICON[alert.kind]}</span>
              <div>
                <p className={`text-xs leading-snug ${
                  alert.severity === "critical" ? "text-red-300" : "text-amber-300"
                }`}>
                  {alert.message}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                  {alert.kind.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

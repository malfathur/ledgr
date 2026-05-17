const ALERTS = [
  { icon: "⚠️", text: "Commitment due in X days" },
  { icon: "🔴", text: "Overdue: [category]" },
  { icon: "🟡", text: "Near limit: [category]" },
];

export default function AlertsPlaceholder() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <p className="font-semibold text-gray-100">Alerts</p>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
          Coming soon
        </span>
      </div>

      <div className="divide-y divide-gray-800">
        {ALERTS.map(({ icon, text }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-2.5 text-sm text-gray-400 opacity-40"
          >
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

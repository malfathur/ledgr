export default function CommitmentsPlaceholder() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <p className="font-semibold text-gray-100">Commitments</p>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
          Coming soon
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500">
            <th className="pb-2 text-left font-medium">Name</th>
            <th className="pb-2 text-left font-medium">Due Date</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {[["w-28", "w-16", "w-12"], ["w-20", "w-16", "w-10"], ["w-24", "w-16", "w-14"]].map(
            ([nameW, dateW, amtW], i) => (
              <tr key={i}>
                <td className="py-2.5">
                  <div className={`${nameW} h-3 animate-pulse rounded bg-gray-800`} />
                </td>
                <td className="py-2.5">
                  <div className={`${dateW} h-3 animate-pulse rounded bg-gray-800`} />
                </td>
                <td className="py-2.5 flex justify-end">
                  <div className={`${amtW} h-3 animate-pulse rounded bg-gray-800`} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-gray-600">
        Monthly fixed obligations will appear here.
      </p>
    </div>
  );
}

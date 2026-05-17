import { fmtRM } from "@/lib/fmt";
import type { CategoryNode } from "@/lib/summary";

type Props = {
  node: CategoryNode;
  compact?: boolean;
  onClick?: () => void;
};

export default function CategoryCard({ node, compact = false, onClick }: Props) {
  const availColor =
    node.available < 0 ? "text-red-400" : "text-emerald-400";

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between py-2 ${onClick ? "cursor-pointer hover:opacity-70" : ""}`}
        onClick={onClick}
      >
        <span className="text-sm text-gray-300">{node.name}</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-24 text-right text-white">{fmtRM(node.actual)}</span>
          <span className={`w-24 text-right font-medium ${availColor}`}>{fmtRM(node.available)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-gray-900 px-4 py-3 ${onClick ? "cursor-pointer hover:bg-gray-800" : ""}`}
      onClick={onClick}
    >
      <p className="mb-2 text-sm font-medium text-gray-300">{node.name}</p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Expected</p>
          <p className="font-medium">{fmtRM(node.expected)}</p>
        </div>
        <div>
          <p className="text-gray-500">Actual</p>
          <p className="font-medium text-white">{fmtRM(node.actual)}</p>
        </div>
        <div>
          <p className="text-gray-500">Available</p>
          <p className={`font-semibold ${availColor}`}>{fmtRM(node.available)}</p>
        </div>
      </div>
    </div>
  );
}

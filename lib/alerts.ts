import type { Commitment } from "./commitments";
import type { CategoryNode } from "./summary";

export type AlertSeverity = "critical" | "warning";

export type AlertKind =
  | "COMMITMENT_OVERDUE"
  | "COMMITMENT_DUE_SOON"
  | "BUDGET_EXCEEDED"
  | "BUDGET_NEAR_LIMIT"
  | "BUDGET_UNALLOCATED";

export type Alert = {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  message: string;
};

function getLeaves(nodes: CategoryNode[]): CategoryNode[] {
  const leaves: CategoryNode[] = [];
  function walk(n: CategoryNode) {
    if (n.children.length === 0) leaves.push(n);
    else n.children.forEach(walk);
  }
  nodes.forEach(walk);
  return leaves;
}

export function deriveAlerts(
  commitments: Commitment[],
  paidIds: number[],
  tree: CategoryNode[],
  now: Date
): Alert[] {
  const alerts: Alert[] = [];
  const today = now.getDate();
  const paid = new Set(paidIds);

  // ── Commitment alerts — skip already-paid ──
  for (const c of commitments) {
    if (paid.has(c.id)) continue;
    if (c.due_day < today) {
      alerts.push({
        id: `commitment-overdue-${c.id}`,
        kind: "COMMITMENT_OVERDUE",
        severity: "critical",
        message: `${c.name} was due on day ${c.due_day}`,
      });
    } else if (c.due_day - today <= 3) {
      const daysLeft = c.due_day - today;
      alerts.push({
        id: `commitment-soon-${c.id}`,
        kind: "COMMITMENT_DUE_SOON",
        severity: "warning",
        message: `${c.name} due in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (day ${c.due_day})`,
      });
    }
  }

  // ── Budget alerts — leaf categories only, skip income ──
  const leaves = getLeaves(tree.filter((n) => n.slug !== "income"));

  for (const leaf of leaves) {
    if (leaf.expected <= 0) continue;

    if (leaf.available < 0) {
      alerts.push({
        id: `budget-exceeded-${leaf.id}`,
        kind: "BUDGET_EXCEEDED",
        severity: "critical",
        message: `${leaf.name} over budget by RM ${Math.abs(leaf.available).toFixed(2)}`,
      });
    } else {
      const usagePct = leaf.actual / leaf.expected;
      if (usagePct >= 0.85) {
        const remaining = ((1 - usagePct) * 100).toFixed(0);
        alerts.push({
          id: `budget-near-${leaf.id}`,
          kind: "BUDGET_NEAR_LIMIT",
          severity: "warning",
          message: `${leaf.name} at ${(usagePct * 100).toFixed(0)}% — ${remaining}% remaining`,
        });
      }
    }
  }

  // ── Unallocated budget alert ──
  const totalIncomeExpected = tree.filter((n) => n.type === "income").reduce((s, n) => s + n.expected, 0);
  const totalExpenseExpected = tree.filter((n) => n.type === "expense").reduce((s, n) => s + n.expected, 0);
  const unallocated = totalIncomeExpected - totalExpenseExpected;
  if (totalIncomeExpected > 0 && unallocated > 0.01) {
    alerts.push({
      id: "budget-unallocated",
      kind: "BUDGET_UNALLOCATED",
      severity: "warning",
      message: `RM ${unallocated.toFixed(2)} of budgeted income is unallocated`,
    });
  }

  // Critical alerts first, then warnings
  return alerts.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "critical" ? -1 : 1;
  });
}

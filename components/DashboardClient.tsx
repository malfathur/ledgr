"use client";

import { useState } from "react";
import DashboardShell from "./DashboardShell";
import AvailableFundsPanel from "./AvailableFundsPanel";
import QuickActionsPanel from "./QuickActionsPanel";
import CashFlowMini from "./CashFlowMini";
import CommitmentsTable from "./CommitmentsTable";
import AlertsPanel from "./AlertsPanel";
import CategoryPanel from "./CategoryPanel";
import BudgetRequiredModal from "./BudgetRequiredModal";
import type { CategoryNode } from "@/lib/summary";
import type { Transaction } from "@/lib/transactions";
import type { Commitment } from "@/lib/commitments";
import type { Alert } from "@/lib/alerts";

type Props = {
  tree: CategoryNode[];
  surplus: number;
  transactions: Transaction[];
  commitments: Commitment[];
  paidIds: number[];
  alerts: Alert[];
  month: number;
  year: number;
  budgetIsSet: boolean;
  isAdmin: boolean;
  isPreview?: boolean;
};

export default function DashboardClient({
  tree,
  surplus,
  transactions,
  commitments,
  paidIds,
  alerts,
  month,
  year,
  budgetIsSet,
  isAdmin,
  isPreview = false,
}: Props) {
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);

  function findNode(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
    for (const n of nodes) {
      if (n.slug === slug) return n;
      const found = findNode(n.children, slug);
      if (found) return found;
    }
  }

  const incomeNode  = findNode(tree, "income");
  const billsNode   = findNode(tree, "bills");
  const savingsNode = findNode(tree, "savings");

  const totalIncome    = incomeNode?.actual ?? 0;
  const totalSpending  = billsNode?.actual ?? 0;
  const totalSavings   = savingsNode?.actual ?? 0;
  const expenseGroups  = billsNode?.children ?? [];

  const nav = (
    <nav className="flex items-center justify-center gap-1 border-t border-gray-800 pt-4">
      <a href="/setup" className="rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
        Setup
      </a>
      {isAdmin && (
        <a href="/admin" className="rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
          Admin
        </a>
      )}
      <a href="/account" className="rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
        Account
      </a>
      <button
        onClick={async () => {
          if (isPreview) return;
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
      >
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {!budgetIsSet && <BudgetRequiredModal />}

      <CategoryPanel
        node={selectedNode}
        transactions={transactions}
        onClose={() => setSelectedNode(null)}
      />

      <DashboardShell
        month={month}
        year={year}
        topLeft={
          <AvailableFundsPanel
            totalIncome={totalIncome}
            totalSpending={totalSpending}
            expenseNodes={expenseGroups}
            transactions={transactions}
            month={month}
            year={year}
          />
        }
        topRight={
          <div className="flex h-full flex-col justify-between">
            <QuickActionsPanel />
            <CashFlowMini
              totalIncome={totalIncome}
              totalSpending={totalSpending}
              totalSavings={totalSavings}
            />
          </div>
        }
        bottomLeft={<CommitmentsTable initialCommitments={commitments} initialPaidIds={paidIds} isPreview={isPreview} />}
        bottomRight={<AlertsPanel alerts={alerts} />}
        nav={nav}
      />
    </>
  );
}

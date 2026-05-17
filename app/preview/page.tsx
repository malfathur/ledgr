import DashboardClient from "@/components/DashboardClient";
import type { CategoryNode } from "@/lib/summary";
import type { Transaction } from "@/lib/transactions";
import type { Commitment } from "@/lib/commitments";
import type { Alert } from "@/lib/alerts";

// ── Mock data — simulates a typical working adult in Malaysia ──
// Tree mirrors seed.sql exactly: Income (level 0) + Bills (level 0) as roots.

const INCOME: CategoryNode = {
  id: 1, name: "Income", slug: "income", parent_id: null, level: 0, type: "income",
  expected: 8500, actual: 8500, available: 0,
  children: [
    { id: 11, name: "Primary Income", slug: "primary-income", parent_id: 1, level: 1, type: "income", expected: 7500, actual: 7500, available: 0, children: [] },
    { id: 12, name: "Secondary Income", slug: "secondary-income", parent_id: 1, level: 1, type: "income", expected: 1000, actual: 1000, available: 0, children: [] },
    { id: 13, name: "Passive Income", slug: "passive-income", parent_id: 1, level: 1, type: "income", expected: 0, actual: 0, available: 0, children: [] },
    { id: 14, name: "Other Income", slug: "other-income", parent_id: 1, level: 1, type: "income", expected: 0, actual: 0, available: 0, children: [] },
  ],
};

const BILLS: CategoryNode = {
  id: 2, name: "Bills", slug: "bills", parent_id: null, level: 0, type: "expense",
  expected: 7270, actual: 7140, available: 130,
  children: [
    {
      id: 3, name: "Housing", slug: "housing", parent_id: 2, level: 1, type: "expense",
      expected: 2220, actual: 2070, available: 150,
      children: [
        { id: 31, name: "Rent / Mortgage", slug: "rent-mortgage", parent_id: 3, level: 2, type: "expense", expected: 1800, actual: 1800, available: 0, children: [] },
        { id: 32, name: "Utilities", slug: "utilities", parent_id: 3, level: 2, type: "expense", expected: 300, actual: 150, available: 150, children: [] },
        { id: 33, name: "Internet", slug: "internet", parent_id: 3, level: 2, type: "expense", expected: 120, actual: 120, available: 0, children: [] },
        { id: 34, name: "Home Maintenance", slug: "home-maintenance", parent_id: 3, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
      ],
    },
    {
      id: 4, name: "Transport", slug: "transport", parent_id: 2, level: 1, type: "expense",
      expected: 1000, actual: 1070, available: -70,
      children: [
        { id: 41, name: "Car Loan", slug: "car-loan", parent_id: 4, level: 2, type: "expense", expected: 600, actual: 600, available: 0, children: [] },
        { id: 42, name: "Petrol & Toll", slug: "petrol-toll", parent_id: 4, level: 2, type: "expense", expected: 300, actual: 370, available: -70, children: [] },
        { id: 43, name: "Public Transport", slug: "public-transport", parent_id: 4, level: 2, type: "expense", expected: 100, actual: 100, available: 0, children: [] },
        { id: 44, name: "Vehicle Maintenance", slug: "vehicle-maintenance", parent_id: 4, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
      ],
    },
    {
      id: 5, name: "Food", slug: "food", parent_id: 2, level: 1, type: "expense",
      expected: 1200, actual: 1090, available: 110,
      children: [
        { id: 51, name: "Groceries", slug: "groceries", parent_id: 5, level: 2, type: "expense", expected: 700, actual: 680, available: 20, children: [] },
        { id: 52, name: "Dining Out", slug: "dining-out", parent_id: 5, level: 2, type: "expense", expected: 400, actual: 380, available: 20, children: [] },
        { id: 53, name: "Coffee & Snacks", slug: "coffee-snacks", parent_id: 5, level: 2, type: "expense", expected: 100, actual: 30, available: 70, children: [] },
      ],
    },
    {
      id: 6, name: "Health & Family", slug: "health-family", parent_id: 2, level: 1, type: "expense",
      expected: 350, actual: 295, available: 55,
      children: [
        { id: 61, name: "Medical", slug: "medical", parent_id: 6, level: 2, type: "expense", expected: 200, actual: 145, available: 55, children: [] },
        { id: 62, name: "Insurance", slug: "insurance", parent_id: 6, level: 2, type: "expense", expected: 150, actual: 150, available: 0, children: [] },
        { id: 63, name: "Childcare", slug: "childcare", parent_id: 6, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
        { id: 64, name: "Education", slug: "education", parent_id: 6, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
      ],
    },
    {
      id: 7, name: "Debts", slug: "debts", parent_id: 2, level: 1, type: "expense",
      expected: 0, actual: 0, available: 0,
      children: [
        { id: 71, name: "Personal Loan", slug: "personal-loan", parent_id: 7, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
        { id: 72, name: "Credit Card", slug: "credit-card", parent_id: 7, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
        { id: 73, name: "Study Loan", slug: "study-loan", parent_id: 7, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
        { id: 74, name: "Other Debt", slug: "other-debt", parent_id: 7, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
      ],
    },
    {
      id: 8, name: "Lifestyle", slug: "lifestyle", parent_id: 2, level: 1, type: "expense",
      expected: 500, actual: 615, available: -115,
      children: [
        { id: 81, name: "Subscriptions", slug: "subscriptions", parent_id: 8, level: 2, type: "expense", expected: 150, actual: 145, available: 5, children: [] },
        { id: 82, name: "Entertainment", slug: "entertainment", parent_id: 8, level: 2, type: "expense", expected: 150, actual: 150, available: 0, children: [] },
        { id: 83, name: "Shopping", slug: "shopping", parent_id: 8, level: 2, type: "expense", expected: 200, actual: 320, available: -120, children: [] },
        { id: 84, name: "Travel", slug: "travel", parent_id: 8, level: 2, type: "expense", expected: 0, actual: 0, available: 0, children: [] },
      ],
    },
    {
      id: 9, name: "Savings", slug: "savings", parent_id: 2, level: 1, type: "expense",
      expected: 1200, actual: 1200, available: 0,
      children: [
        { id: 91, name: "Emergency Fund", slug: "emergency-fund", parent_id: 9, level: 2, type: "expense", expected: 500, actual: 500, available: 0, children: [] },
        { id: 92, name: "General Saving", slug: "general-saving", parent_id: 9, level: 2, type: "expense", expected: 500, actual: 500, available: 0, children: [] },
        { id: 93, name: "Special Occasion", slug: "special-occasion", parent_id: 9, level: 2, type: "expense", expected: 200, actual: 200, available: 0, children: [] },
      ],
    },
    {
      id: 10, name: "Investment", slug: "investment", parent_id: 2, level: 1, type: "expense",
      expected: 800, actual: 800, available: 0,
      children: [
        { id: 101, name: "Investment A", slug: "investment-a", parent_id: 10, level: 2, type: "expense", expected: 500, actual: 500, available: 0, children: [] },
        { id: 102, name: "Investment B", slug: "investment-b", parent_id: 10, level: 2, type: "expense", expected: 300, actual: 300, available: 0, children: [] },
      ],
    },
  ],
};

const mockTree: CategoryNode[] = [INCOME, BILLS];

const mockSurplus = INCOME.actual - BILLS.actual;

const mockTransactions: Transaction[] = [
  { id: 1, user_id: 1, category_id: 31, description: "Monthly rent", amount: 1800, date: "2026-05-01", month: 5, year: 2026, created_at: "2026-05-01", category_name: "Rent / Mortgage", category_slug: "rent-mortgage", parent_id: 3 },
  { id: 2, user_id: 1, category_id: 33, description: "Unifi broadband", amount: 120, date: "2026-05-01", month: 5, year: 2026, created_at: "2026-05-01", category_name: "Internet", category_slug: "internet", parent_id: 3 },
  { id: 3, user_id: 1, category_id: 41, description: "Car loan payment", amount: 600, date: "2026-05-01", month: 5, year: 2026, created_at: "2026-05-01", category_name: "Car Loan", category_slug: "car-loan", parent_id: 4 },
  { id: 4, user_id: 1, category_id: 51, description: "Jaya Grocer", amount: 320, date: "2026-05-03", month: 5, year: 2026, created_at: "2026-05-03", category_name: "Groceries", category_slug: "groceries", parent_id: 5 },
  { id: 5, user_id: 1, category_id: 11, description: "May salary", amount: 7500, date: "2026-05-05", month: 5, year: 2026, created_at: "2026-05-05", category_name: "Primary Income", category_slug: "primary-income", parent_id: 1 },
  { id: 6, user_id: 1, category_id: 42, description: "Petronas fill-up", amount: 180, date: "2026-05-06", month: 5, year: 2026, created_at: "2026-05-06", category_name: "Petrol & Toll", category_slug: "petrol-toll", parent_id: 4 },
  { id: 7, user_id: 1, category_id: 91, description: "Emergency fund xfer", amount: 500, date: "2026-05-07", month: 5, year: 2026, created_at: "2026-05-07", category_name: "Emergency Fund", category_slug: "emergency-fund", parent_id: 9 },
  { id: 8, user_id: 1, category_id: 93, description: "Travel fund", amount: 200, date: "2026-05-07", month: 5, year: 2026, created_at: "2026-05-07", category_name: "Special Occasion", category_slug: "special-occasion", parent_id: 9 },
  { id: 9, user_id: 1, category_id: 101, description: "ASNB top-up", amount: 500, date: "2026-05-07", month: 5, year: 2026, created_at: "2026-05-07", category_name: "Investment A", category_slug: "investment-a", parent_id: 10 },
  { id: 10, user_id: 1, category_id: 52, description: "Madam Kwan's dinner", amount: 200, date: "2026-05-09", month: 5, year: 2026, created_at: "2026-05-09", category_name: "Dining Out", category_slug: "dining-out", parent_id: 5 },
  { id: 11, user_id: 1, category_id: 43, description: "Grab + LRT", amount: 100, date: "2026-05-09", month: 5, year: 2026, created_at: "2026-05-09", category_name: "Public Transport", category_slug: "public-transport", parent_id: 4 },
  { id: 12, user_id: 1, category_id: 62, description: "AIA premium", amount: 150, date: "2026-05-10", month: 5, year: 2026, created_at: "2026-05-10", category_name: "Insurance", category_slug: "insurance", parent_id: 6 },
  { id: 13, user_id: 1, category_id: 81, description: "Adobe CC", amount: 65, date: "2026-05-10", month: 5, year: 2026, created_at: "2026-05-10", category_name: "Subscriptions", category_slug: "subscriptions", parent_id: 8 },
  { id: 14, user_id: 1, category_id: 51, description: "Village Grocer", amount: 210, date: "2026-05-12", month: 5, year: 2026, created_at: "2026-05-12", category_name: "Groceries", category_slug: "groceries", parent_id: 5 },
  { id: 15, user_id: 1, category_id: 83, description: "H&M shirt", amount: 180, date: "2026-05-13", month: 5, year: 2026, created_at: "2026-05-13", category_name: "Shopping", category_slug: "shopping", parent_id: 8 },
  { id: 16, user_id: 1, category_id: 82, description: "Movie + bowling", amount: 150, date: "2026-05-13", month: 5, year: 2026, created_at: "2026-05-13", category_name: "Entertainment", category_slug: "entertainment", parent_id: 8 },
  { id: 17, user_id: 1, category_id: 12, description: "Upwork project payout", amount: 1000, date: "2026-05-14", month: 5, year: 2026, created_at: "2026-05-14", category_name: "Secondary Income", category_slug: "secondary-income", parent_id: 1 },
  { id: 18, user_id: 1, category_id: 42, description: "Petronas fill-up", amount: 190, date: "2026-05-15", month: 5, year: 2026, created_at: "2026-05-15", category_name: "Petrol & Toll", category_slug: "petrol-toll", parent_id: 4 },
  { id: 19, user_id: 1, category_id: 81, description: "Netflix + Spotify", amount: 80, date: "2026-05-15", month: 5, year: 2026, created_at: "2026-05-15", category_name: "Subscriptions", category_slug: "subscriptions", parent_id: 8 },
  { id: 20, user_id: 1, category_id: 32, description: "TNB electricity", amount: 150, date: "2026-05-16", month: 5, year: 2026, created_at: "2026-05-16", category_name: "Utilities", category_slug: "utilities", parent_id: 3 },
  { id: 21, user_id: 1, category_id: 83, description: "Uniqlo trousers", amount: 140, date: "2026-05-16", month: 5, year: 2026, created_at: "2026-05-16", category_name: "Shopping", category_slug: "shopping", parent_id: 8 },
  { id: 22, user_id: 1, category_id: 52, description: "Makan @ SS15", amount: 180, date: "2026-05-16", month: 5, year: 2026, created_at: "2026-05-16", category_name: "Dining Out", category_slug: "dining-out", parent_id: 5 },
  { id: 23, user_id: 1, category_id: 92, description: "Savings transfer", amount: 500, date: "2026-05-17", month: 5, year: 2026, created_at: "2026-05-17", category_name: "General Saving", category_slug: "general-saving", parent_id: 9 },
  { id: 24, user_id: 1, category_id: 102, description: "ETF purchase", amount: 300, date: "2026-05-17", month: 5, year: 2026, created_at: "2026-05-17", category_name: "Investment B", category_slug: "investment-b", parent_id: 10 },
  { id: 25, user_id: 1, category_id: 53, description: "ZUS Coffee", amount: 30, date: "2026-05-17", month: 5, year: 2026, created_at: "2026-05-17", category_name: "Coffee & Snacks", category_slug: "coffee-snacks", parent_id: 5 },
  { id: 26, user_id: 1, category_id: 61, description: "Clinic visit", amount: 145, date: "2026-05-17", month: 5, year: 2026, created_at: "2026-05-17", category_name: "Medical", category_slug: "medical", parent_id: 6 },
  { id: 27, user_id: 1, category_id: 51, description: "Tesco", amount: 150, date: "2026-05-17", month: 5, year: 2026, created_at: "2026-05-17", category_name: "Groceries", category_slug: "groceries", parent_id: 5 },
];

const mockCommitments: Commitment[] = [
  { id: 1, user_id: 1, name: "Rent", amount: 1800, due_day: 1, category_id: 31, is_active: 1, created_at: "2026-01-01" },
  { id: 2, user_id: 1, name: "Car Loan", amount: 600, due_day: 1, category_id: 41, is_active: 1, created_at: "2026-01-01" },
  { id: 3, user_id: 1, name: "Unifi Broadband", amount: 120, due_day: 1, category_id: 33, is_active: 1, created_at: "2026-01-01" },
  { id: 4, user_id: 1, name: "Emergency Fund", amount: 500, due_day: 7, category_id: 91, is_active: 1, created_at: "2026-01-01" },
  { id: 5, user_id: 1, name: "ASNB Top-up", amount: 500, due_day: 7, category_id: 101, is_active: 1, created_at: "2026-01-01" },
  { id: 6, user_id: 1, name: "Adobe CC", amount: 65, due_day: 10, category_id: 81, is_active: 1, created_at: "2026-01-01" },
  { id: 7, user_id: 1, name: "AIA Insurance", amount: 150, due_day: 10, category_id: 62, is_active: 1, created_at: "2026-01-01" },
  { id: 8, user_id: 1, name: "ETF Purchase", amount: 300, due_day: 20, category_id: 102, is_active: 1, created_at: "2026-01-01" },
];

// Commitments marked paid this month (rent, car loan, broadband, emergency fund, ASNB, Adobe CC, AIA)
const mockPaidIds = [1, 2, 3, 4, 5, 6, 7];

const mockAlerts: Alert[] = [
  {
    id: "budget-exceeded-42",
    kind: "BUDGET_EXCEEDED",
    severity: "critical",
    message: "Petrol & Toll over budget by RM 70.00",
  },
  {
    id: "budget-exceeded-83",
    kind: "BUDGET_EXCEEDED",
    severity: "critical",
    message: "Shopping over budget by RM 120.00",
  },
  {
    id: "commitment-soon-8",
    kind: "COMMITMENT_DUE_SOON",
    severity: "warning",
    message: "ETF Purchase due in 3 days (day 20)",
  },
  {
    id: "budget-near-52",
    kind: "BUDGET_NEAR_LIMIT",
    severity: "warning",
    message: "Dining Out at 95% — 5% remaining",
  },
  {
    id: "budget-near-51",
    kind: "BUDGET_NEAR_LIMIT",
    severity: "warning",
    message: "Groceries at 97% — 3% remaining",
  },
];

export default function PreviewPage() {
  return (
    <main>
      <DashboardClient
        tree={mockTree}
        surplus={mockSurplus}
        transactions={mockTransactions}
        commitments={mockCommitments}
        paidIds={mockPaidIds}
        alerts={mockAlerts}
        month={5}
        year={2026}
        budgetIsSet={true}
        isAdmin={false}
      />
    </main>
  );
}

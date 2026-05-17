# Changelog

All notable changes to L.E.D.G.R are documented here.

Format: [Semantic Versioning](https://semver.org/). Structure: `Added / Fixed / Changed / Removed`.

---

## v2.0.3 — 2026-05-17

### Fixed
- Admin account now stores a real bcrypt hash on first login; empty `password_hash` on existing installs is patched on next login
- `/api/auth/password` blocks admin with a clear 400 — admin password is managed via `ROOT_PASSWORD` env var
- `/account` page hides the password form for admin and shows an explanation instead
- Rate limiting on `/api/auth/login` — 5 attempts per IP per 15 minutes, returns 429
- All API route handlers now catch DB errors and return generic 500 (no raw errors to clients)
- Date validation on transaction create/edit — rejects non-`YYYY-MM-DD` input with 400 instead of silently writing `NaN`
- Duplicate `getTransactions` SQL removed — API route now delegates to `lib/transactions.ts`
- Onboarding reseed now deletes commitments and transactions before categories (fixes FK constraint 500 on reseed)
- Dashboard donut breakdown now segments by Bills sub-groups (Housing, Transport, Food, etc.) instead of all expense nodes
- Donut legend layout changed to stacked name/value per item — removes forced gap from `ml-auto`

### Removed
- Unused `recharts` dependency (dashboard chart is custom SVG)
- Dead `lib/schema.ts` wrapper (`layout.tsx` calls `ensureDb` directly)
- Dead `sessions` table from `schema.sql` (app uses JWT cookies, never sessions table)

---

## v2.0.2 — 2026-05-17

### Added
- `/setup` page — centralised configuration for categories and commitments
- `SetupCategories` component — category tree view with inline add/delete per group; admin-only writes, non-admin read-only; delete blocked if category has transactions (409)
- `SetupCommitments` component — full CRUD for commitments (add, edit, delete), moved from dashboard
- `POST /api/categories` — admin-only category creation
- `DELETE /api/categories/[id]` — admin-only deletion with FK safety check

### Changed
- `CommitmentsTable` simplified to read-only (Mark Paid only) + "Manage →" link to `/setup`
- Dashboard nav updated to: Setup · Admin (admin only) · Account · Logout

---

## v2.0.1 — 2026-05-12

### Changed
- **Category tree overhaul** — replaced old tree (Salary/Other Income, Bills > Debts/Commitments/Goals/Discretionary) with a general-purpose structure:
  - Income: Primary Income, Secondary Income, Passive Income, Other Income
  - Bills: Housing, Transport, Food, Health & Family, Debts, Lifestyle, Savings, Investment (each with 3–4 leaf sub-categories)
- `seed.sql` completely replaced — wipes non-user data on restart and inserts new tree
- Summary page redesigned — split into two sections:
  - **Income panel** (top): Source / Expected / Received — no "Diff" column, income is not a budget to stay within
  - **Spending breakdown** (below): Category / Budgeted / Spent / Remaining, colour-coded

---

## v2.0.0 — 2026-05-08

### Added
- Dashboard redesigned to full-width 2×2 grid layout
- **Available Funds panel** (top-left) — animated SVG ring chart showing income vs spending; tap to toggle category breakdown; centre label shows available RM; empty state for months with no income
- **Quick Actions + Cash Flow panel** (top-right) — Add Transaction / Budget / History CTAs; Outflow, Net Savings, Savings Rate stat tiles
- **Commitments table** (bottom-left) — live recurring obligations with Mark Paid; links to `/setup` for management
- **Alerts panel** (bottom-right) — automatic alerts: commitment due soon, overdue, budget near limit, budget exceeded
- `commitments` and `commitment_payments` DB tables (migration runs on cold start)
- Full commitments CRUD API (`GET/POST /api/commitments`, `PATCH/DELETE /api/commitments/[id]`, `POST /api/commitments/[id]/pay`)
- `lib/commitments.ts` — data functions for commitments
- `lib/alerts.ts` — pure alert derivation from commitments + budget tree

### Removed
- Floating `+` FAB from dashboard (replaced by Quick Actions panel)

---

## v1.0.0 — 2026-05-05

Initial Design & Development.

### Added
- Dashboard with per-category available balance and surplus/deficit summary
- Add transaction form with category selector and budget hint
- Monthly budget form with rollover ("Copy last month") support
- Summary page: Expected vs Actual vs Difference table, full category hierarchy
- History page: browse past months, filter by category, text search, edit/delete transactions, CSV export
- Multi-user support — admin can create/delete users and reset passwords
- Session auth — bcrypt password + JWT cookie, 30-day expiry
- Budget required modal with skip option
- Month selector capped at current month — no navigating into the future
- History header shows net (income − expenses) with colour coding
- Turso (SQLite-compatible) database with automatic schema init and migration on cold start
- Render deployment config (`render.yaml`)

### Category structure
- Four consistent sub-groups under Bills: Debts, Commitments, Goals, Discretionary
- Goals group: Savings, Investments
- Discretionary group: Leisure, Misc
- Available colour logic: red only when over budget (negative), green otherwise

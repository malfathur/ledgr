# L.E.D.G.R

A self-hosted personal finance tracker I built and use daily. Log income and expenses against a monthly budget, track recurring commitments, and get automatic alerts when you're near or over budget.

I designed the feature scope and data model, used Claude to generate implementation, then reviewed and debugged it. The stack, schema, and product decisions are mine. Claude did the typing.

> **Currency is hardcoded to RM (Malaysian Ringgit).** If you need a different currency, change `lib/fmt.ts` — it's one function.

> **Desktop only.** The dashboard uses a fixed 2×2 grid layout. Mobile and small screens are not supported.

Once deployed, see **[MANUAL.md](./MANUAL.md)** for a full guide on using the app.

Preview at https://ledgr-m27h.onrender.com/preview!

---

## What it does

- **Dashboard** — donut chart of income vs spending, available balance, cash flow stats
- **Budgeting** — set expected amounts per category each month; rollover from last month with one click
- **Transactions** — log income and expenses to leaf categories; totals roll up to parent groups automatically
- **Commitments** — track recurring obligations (rent, subscriptions, loans); mark paid to auto-log the transaction
- **Alerts** — automatic warnings when a category is near limit or over budget, and when a commitment is due
- **Summary** — monthly income panel + spending breakdown (Budgeted vs Actual vs Remaining)
- **History** — browse any past month, filter by category, edit/delete entries, export CSV
- **Multi-user** — admin creates accounts; each user has their own budget and transactions; categories are shared
- **Setup** — admin can add/delete categories from the UI; non-admin users can manage their own commitments

---

## Deploy for free (Turso + Render)

This is the stack the app is built for. Both have free tiers that are more than enough for personal use.

**What you need:** a GitHub account, a Turso account, a Render account. No credit card required on either.

---

### Step 1 — Fork the repo

Fork or clone this repo to your own GitHub account. Render will deploy from there.

---

### Step 2 — Set up Turso (your database)

Turso is a serverless SQLite database. Free tier gives you 500 databases and 9 GB storage.

1. Sign up at [turso.tech](https://turso.tech)
2. Install the Turso CLI:
   ```bash
   # macOS / Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (PowerShell)
   irm https://get.tur.so/install.ps1 | iex
   ```
3. Log in:
   ```bash
   turso auth login
   ```
4. Create a database:
   ```bash
   turso db create ledgr
   ```
5. Get your database URL:
   ```bash
   turso db show ledgr --url
   # looks like: libsql://ledgr-yourname.turso.io
   ```
6. Create an auth token:
   ```bash
   turso db tokens create ledgr
   # long string — copy it, you'll need it in Step 4
   ```

Keep both values. You'll paste them into Render as environment variables.

---

### Step 3 — Deploy on Render

Render is a cloud hosting platform. Free tier runs your app on a Node.js server. It will sleep after 15 minutes of inactivity and wake up on the next request (cold start takes ~30 seconds on the free plan).

1. Sign up at [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub account and select your forked repo
4. Render will detect `render.yaml` automatically and pre-fill the settings — leave them as-is
5. Click **Create Web Service** — don't deploy yet

---

### Step 4 — Set your environment variables

In the Render dashboard, go to your service → **Environment** tab and add these four variables:

| Variable | Value |
|---|---|
| `TURSO_URL` | Your Turso database URL from Step 2 |
| `TURSO_AUTH_TOKEN` | Your Turso auth token from Step 2 |
| `ROOT_PASSWORD` | The password you want for the admin account — choose anything |
| `SESSION_SECRET` | Any long random string — used to sign session cookies |

For `SESSION_SECRET`, you can generate one in your terminal:
```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

Once all four are set, click **Manual Deploy → Deploy latest commit**.

---

### Step 5 — First login

Once deployed, open your Render URL. You'll land on the login page.

- **Username:** `admin`
- **Password:** whatever you set as `ROOT_PASSWORD`

On first login the app runs the schema and seeds the default category tree automatically. You'll be taken through a short onboarding to confirm the category structure — you can use the default or customise it from `/setup` later.

That's it. Your instance is live.

---

## Local setup

```bash
git clone https://github.com/malfathur/ledgr
cd ledgr
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Turso credentials (same ones from above, or create a separate dev DB):

```env
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
ROOT_PASSWORD=anything
SESSION_SECRET=any-long-string
```

```bash
npm run dev
# runs on http://localhost:2001
```

---

## Category structure

The default seed creates a three-level hierarchy. You can add or remove categories from `/setup` (admin only). Deleting a category is blocked if it has transactions — you'd need to reassign or delete those first.

```
Income
├── Primary Income
├── Secondary Income
├── Passive Income
└── Other Income

Bills
├── Housing       → Rent/Mortgage, Utilities, Internet, Home Maintenance
├── Transport     → Car Loan, Petrol & Toll, Public Transport, Vehicle Maintenance
├── Food          → Groceries, Dining Out, Coffee & Snacks
├── Health & Family → Medical, Insurance, Childcare, Education
├── Debts         → Personal Loan, Credit Card, Study Loan, Other Debt
├── Lifestyle     → Subscriptions, Entertainment, Shopping, Travel
├── Savings       → Emergency Fund, General Saving, Special Occasion
└── Investment    → Investment A, Investment B
```

Budgets and transactions attach to **leaf nodes only**. Parent totals are computed by rollup — you never enter data at the group level.

---

## How it works (for the technical)

**Auth** — bcrypt passwords + JWT signed with `SESSION_SECRET`, stored as an `httpOnly` cookie. Sessions expire in 30 days. Admin authenticates against `ROOT_PASSWORD`; a bcrypt hash is stored on first login for DB consistency. Admin password changes by updating the env var, not through the UI.

**Database** — Turso is libSQL (SQLite-compatible) hosted serverlessly. The app connects via `@libsql/client`. Schema and migrations run automatically on cold start via `lib/db.ts` (`ensureDb()`). Migrations for new columns are handled in the same init path.

**Rendering** — all pages are Next.js server components with `force-dynamic`. Data fetches happen server-side; client components receive props only. No client-side data fetching on page load.

**Multi-user** — categories are global (shared across all users). Budgets and transactions are per-user. Admin manages users from `/admin`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Turso (`@libsql/client`) — SQLite-compatible, serverless |
| Charts | Custom SVG ring chart (no charting library) |
| Styling | Tailwind CSS |
| Auth | bcryptjs + jose (JWT) |
| Deployment | Render (Node.js web service, Singapore region) |

---

## Built by

[GitHub](https://github.com/malfathur) · [LinkedIn](https://linkedin.com/in/akmal-fathurrahman-02a27b218)

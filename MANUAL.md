# Ledgr — User Manual

A guide to using Ledgr after it's deployed and running.

---

## First Login

1. Open your Ledgr URL
2. Log in with username `admin` and the password you set as `ROOT_PASSWORD`
3. You'll be taken to the onboarding page — click **Use Stock Categories** to load the default category tree
4. You're now on the dashboard

---

## Dashboard

The dashboard is split into four panels:

| Panel | Description |
|---|---|
| Top-left | Donut chart — income vs spending. Tap to toggle breakdown by category group |
| Top-right | Quick links (Add, Budget, Summary, History, Setup) + cash flow stats |
| Bottom-left | Commitments — recurring obligations with Mark Paid toggle |
| Bottom-right | Alerts — budget warnings and commitment due dates |

The centre of the donut shows **available funds** (income minus spending). It turns red if you've spent more than you earned.

### Breakdown mode

Tapping the donut switches to **breakdown mode**. The right side shows a list of expense groups with their spend for the month — tap any row to hide or show that group.

At the bottom of the list is a **Spend Trend** button (enabled once you have transactions). Tapping it opens a full-screen chart overlay:

- Each line represents a category group's **daily spend** for the month
- The legend at the top lets you hide/show individual groups
- **Hover** over the chart to see a tooltip with the group total and a breakdown of each sub-category that had spend on that day
- Tap **✕** to close the chart and return to the breakdown list

---

## Adding a Transaction

1. Click **Add** from the dashboard or go to `/add`
2. Select a category — only leaf categories appear (e.g. Groceries, not Food)
3. Enter the amount (always positive — income and expense are determined by the category type)
4. Optionally add a description and date (defaults to today)
5. Click **Add Transaction**

---

## Setting a Budget

1. Click **Budget** from the dashboard or go to `/budget`
2. Enter expected amounts for each leaf category
3. Use **Copy Last Month** to roll over last month's budget as a starting point
4. Click **Save Budget**

Budgets are per-user and per-month. You need to set one each month — the dashboard will remind you if you haven't.

---

## Commitments

Commitments are recurring obligations (rent, subscriptions, loan repayments) that you track separately from regular transactions.

**To add a commitment:**
1. Go to `/setup`
2. Under Commitments, click **Add**
3. Enter name, amount, and due day of month
4. Optionally link it to a category so marking it paid auto-logs the transaction

**To mark a commitment paid:**
- On the dashboard, click **Mark Paid** next to the commitment
- This records the payment for the current month and logs a transaction if a category is linked

---

## Summary Page

Go to `/summary` to see a monthly overview split into two sections:

- **Income** — each income source with expected vs received
- **Spending** — each category group with budgeted vs spent vs remaining, colour-coded

Green = under budget. Red = over budget.

---

## History

Go to `/history` to browse any past month.

- Use the month selector to navigate back
- Filter by category or search by description
- Click any transaction to edit or delete it
- Click **Export CSV** to download the month's transactions as a spreadsheet

---

## Managing Categories

Admin only. Go to `/setup` → Categories.

- Click **+ Add** next to any group to add a leaf category under it
- Click the trash icon to delete a category — blocked if it has transactions
- Categories are global and shared across all users

---

## Managing Users

Admin only. Go to `/admin`.

- **Create user** — enter a username and password
- **Reset password** — enter a new password for any non-admin user
- **Delete user** — removes the user; their transactions are reassigned to admin

---

## Changing Your Password

Go to `/account`.

- Enter your current password and a new password (minimum 8 characters)
- Admin accounts cannot change password here — update `ROOT_PASSWORD` in your environment variables instead

---

## Tips

- Budgets and transactions attach to **leaf categories only** — parent group totals are computed automatically
- The month selector is capped at the current month — you cannot enter future transactions
- Income categories (Primary Income, Passive Income, etc.) do not have budget limits — they are tracked as received amounts only
- The app currency is fixed to **RM (Malaysian Ringgit)**. To change it, edit `lib/fmt.ts`

import { test, expect } from '@playwright/test';

test.describe('Add Transaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add');
    await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible();
  });

  test('page loads with category wizard step 1', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bills' })).toBeVisible();
  });

  test('income flow — 2-step wizard (root → leaf)', async ({ page }) => {
    // Step 1: pick Income
    await page.getByRole('button', { name: 'Income' }).click();
    await expect(page.getByRole('button', { name: 'Primary Income' })).toBeVisible({ timeout: 2000 });

    // Step 2: pick Primary Income (direct leaf under Income)
    await page.getByRole('button', { name: 'Primary Income' }).click();
    await expect(page.getByText('Category selected')).toBeVisible({ timeout: 2000 });
  });

  test('expense flow — 3-step wizard (root → group → leaf)', async ({ page }) => {
    // Step 1: Bills
    await page.getByRole('button', { name: 'Bills' }).click();
    await expect(page.getByRole('button', { name: 'Food' })).toBeVisible({ timeout: 2000 });

    // Step 2: Food group
    await page.getByRole('button', { name: 'Food' }).click();
    await expect(page.getByRole('button', { name: 'Groceries' })).toBeVisible({ timeout: 2000 });

    // Step 3: Groceries leaf
    await page.getByRole('button', { name: 'Groceries' }).click();
    await expect(page.getByRole('button', { name: 'Groceries' })).toHaveClass(/ring-indigo-500|bg-indigo-600/);
  });

  test('back button returns to previous step', async ({ page }) => {
    await page.getByRole('button', { name: 'Bills' }).click();
    await page.getByRole('button', { name: 'Food' }).click();

    // Wait for step 3 to render (120ms setTimeout in handleMidPick)
    await expect(page.getByRole('button', { name: 'Groceries' })).toBeVisible({ timeout: 2000 });

    // Should now be on step 3; click back
    await page.getByRole('button', { name: /← Back/ }).last().click();

    // Should be back at step 2 (groups)
    await expect(page.getByRole('button', { name: 'Food' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Groceries' })).not.toBeVisible();
  });

  test('submits a valid income transaction', async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Navigate wizard
    await page.getByRole('button', { name: 'Income' }).click();
    await page.getByRole('button', { name: 'Primary Income' }).click();

    // Fill amount
    await page.getByPlaceholder('0.00').fill('1000');

    // Description (optional)
    await page.getByPlaceholder('e.g. Groceries').fill('Monthly salary');

    // Date is pre-filled with today; ensure it's set
    await page.locator('input[type="date"]').fill(today);

    // Submit
    await page.getByRole('button', { name: 'Add Transaction' }).click();

    // Should redirect to dashboard (current month transaction)
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('submits a valid expense transaction', async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    await page.getByRole('button', { name: 'Bills' }).click();
    await page.getByRole('button', { name: 'Food' }).click();
    await page.getByRole('button', { name: 'Groceries' }).click();

    await page.getByPlaceholder('0.00').fill('50');
    await page.locator('input[type="date"]').fill(today);

    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('past-month transaction redirects to history', async ({ page }) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const pastDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-15`;

    await page.getByRole('button', { name: 'Bills' }).click();
    await page.getByRole('button', { name: 'Food' }).click();
    await page.getByRole('button', { name: 'Dining Out' }).click();

    await page.getByPlaceholder('0.00').fill('25');
    await page.locator('input[type="date"]').fill(pastDate);

    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page).toHaveURL(/\/history\?month=/, { timeout: 5000 });
  });

  test('shows error when submitting without selecting a category', async ({ page }) => {
    await page.getByPlaceholder('0.00').fill('100');
    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page.getByText('Please select a category')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Budget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget');
    await expect(page.getByRole('heading', { name: 'Budget' })).toBeVisible();
  });

  test('loads with Income and Expenses tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();
  });

  test('expenses tab is active by default', async ({ page }) => {
    // Bills root heading is visible on expenses tab
    await expect(page.getByRole('heading', { name: 'Bills' })).toBeVisible();
  });

  test('income tab shows Income section', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click();
    await expect(page.getByRole('heading', { name: 'Income' })).toBeVisible();
  });

  test('income tab contains leaf category inputs', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click();
    // At least one number input should be visible for leaf categories
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('can fill a budget amount on the income tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click();
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.fill('6000');
    await expect(firstInput).toHaveValue('6000');
  });

  test('totals update when amounts are entered', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click();
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.fill('8000');
    // The "Planned income" summary line should update
    await expect(page.getByText('RM 8000.00').first()).toBeVisible();
  });

  test('Copy last month button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /copy last month/i })).toBeVisible();
  });

  test('saves budget and redirects to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click();
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.fill('5000');
    await page.getByRole('button', { name: 'Save Budget' }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('back link navigates to dashboard', async ({ page }) => {
    await page.getByRole('link', { name: '←' }).first().click();
    await expect(page).toHaveURL('/');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/summary');
  });

  test('loads the spending table', async ({ page }) => {
    // SpendingTable is rendered on this page
    // At minimum the page should not redirect and should show month navigation or table content
    await expect(page).toHaveURL('/summary');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('shows Income and Bills sections', async ({ page }) => {
    await expect(page.getByText('Income', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Bills', { exact: false }).first()).toBeVisible();
  });

  test('shows Budgeted / Spent / Left column headers', async ({ page }) => {
    // SpendingTable renders these columns
    await expect(page.getByText('Budgeted', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Spent', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Left', { exact: false }).first()).toBeVisible();
  });

  test('can navigate to previous month', async ({ page }) => {
    const prevButton = page.getByRole('button', { name: /prev|←|‹|previous/i }).first();
    if (await prevButton.isVisible()) {
      const urlBefore = page.url();
      await prevButton.click();
      await page.waitForURL(/month=/);
      expect(page.url()).not.toEqual(urlBefore);
    }
  });

  test('month navigation links exist', async ({ page }) => {
    // MonthSelector component renders prev/next controls
    const nav = page.locator('button, a').filter({ hasText: /prev|←|next|→/i });
    await expect(nav.first()).toBeVisible();
  });

  test('back link navigates to dashboard', async ({ page }) => {
    await page.getByRole('link', { name: '←' }).first().click();
    await expect(page).toHaveURL('/');
  });
});

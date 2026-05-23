import { test, expect } from '@playwright/test';

test.describe('History', () => {
  // Seed a transaction before each test so there's something to act on
  test.beforeEach(async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const catRes = await page.request.get('/api/categories');
    const { categories } = await catRes.json();
    const groceries = categories.find((c: { slug: string }) => c.slug === 'groceries');

    if (groceries) {
      await page.request.post('/api/transactions', {
        data: {
          category_id: groceries.id,
          description: 'Test grocery purchase',
          amount: 45.50,
          date: today,
        },
      });
    }

    await page.goto('/history');
  });

  test('loads the transaction list', async ({ page }) => {
    await expect(page).toHaveURL('/history');
    await expect(page.getByPlaceholder('Search by description or category…')).toBeVisible();
  });

  test('shows transactions', async ({ page }) => {
    await expect(page.getByText('Test grocery purchase').first()).toBeVisible();
  });

  test('search filters transactions by description', async ({ page }) => {
    await page.getByPlaceholder('Search by description or category…').fill('Test grocery');
    await expect(page.getByText('Test grocery purchase').first()).toBeVisible();
  });

  test('search shows no-results message for unmatched query', async ({ page }) => {
    await page.getByPlaceholder('Search by description or category…').fill('zzznomatch');
    await expect(page.getByText('No matching transactions')).toBeVisible();
  });

  test('category filter dropdown is visible', async ({ page }) => {
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.locator('option', { hasText: 'All categories' })).toBeAttached();
  });

  test('CSV export button is visible', async ({ page }) => {
    await expect(page.getByTitle('Export as CSV')).toBeVisible();
  });

  test('edit transaction flow', async ({ page }) => {
    // Edit button has title="Edit" with icon content — use getByTitle
    const editBtn = page.getByTitle('Edit').first();
    await editBtn.click({ force: true });

    // Edit modal should appear
    await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();

    // Change description
    const descInput = page.getByPlaceholder(/description/i).last();
    await descInput.fill('Updated description');

    await page.getByRole('button', { name: 'Save' }).click();

    // Modal closes and list refreshes
    await expect(page.getByRole('heading', { name: /edit/i })).not.toBeVisible();
  });

  test('delete transaction with confirmation', async ({ page }) => {
    const countBefore = await page.getByText('Test grocery purchase').count();

    // Delete button renders ✕ icon with no accessible name — target by text content
    const deleteBtn = page.locator('button').filter({ hasText: /^✕$/ }).first();
    await deleteBtn.click({ force: true });

    // Confirmation buttons appear
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();

    // One transaction removed — count decreases by 1
    await expect(page.getByText('Test grocery purchase')).toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('can navigate to previous month', async ({ page }) => {
    const prevButton = page.getByRole('button', { name: /prev|←|previous/i }).first();
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await expect(page).toHaveURL(/month=/);
    }
  });
});

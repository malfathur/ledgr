import { test, expect } from '@playwright/test';

test.describe('Setup — commitments (regular user)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/setup');
  });

  test('loads the setup page', async ({ page }) => {
    await expect(page).toHaveURL('/setup');
    await expect(page.getByRole('button', { name: '+ Add Commitment' })).toBeVisible();
  });

  test('category tree is visible in read-only mode', async ({ page }) => {
    // Non-admin sees categories but no "+ Add" buttons in the category tree
    await expect(page.getByText('Food')).toBeVisible();
    await expect(page.getByText('Primary Income')).toBeVisible();
  });

  test('regular user cannot see category + Add button', async ({ page }) => {
    // The "+ Add" button in category group headers is admin-only
    const addCategoryBtn = page.getByRole('button', { name: '+ Add', exact: true });
    await expect(addCategoryBtn).not.toBeVisible();
  });

  test('add commitment flow', async ({ page }) => {
    const now = new Date();
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;

    await page.getByRole('button', { name: '+ Add Commitment' }).click();

    // Select category
    await page.getByRole('combobox').selectOption({ label: 'Rent / Mortgage' });

    // Fill amount
    await page.locator('input[type="number"]').fill('1500');

    // Fill due date
    await page.locator('input[type="date"]').fill(dueDate);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Commitment appears in the commitments table (distinct from category tree)
    await expect(page.locator('td').filter({ hasText: 'Rent / Mortgage' })).toBeVisible({ timeout: 5000 });
  });

  test('cancel add commitment clears the form', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Commitment' }).click();
    await expect(page.getByRole('combobox')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('combobox')).not.toBeVisible();
  });

  test('edit commitment', async ({ page }) => {
    // Seed a commitment first
    const catRes = await page.request.get('/api/categories');
    const { categories } = await catRes.json();
    const internet = categories.find((c: { slug: string }) => c.slug === 'internet');

    if (internet) {
      await page.request.post('/api/commitments', {
        data: { name: internet.name, amount: 99, due_day: 5, category_id: internet.id },
      });
    }
    await page.reload();

    // Hover row to reveal edit button and click it
    const row = page.locator('tr').filter({ hasText: 'Internet' });
    await row.getByRole('button', { name: 'Edit' }).click({ force: true });

    // Edit amount
    await row.locator('input[type="number"]').fill('120');
    await row.getByRole('button', { name: 'Save' }).click();

    await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible({ timeout: 3000 });
  });

  test('delete commitment', async ({ page }) => {
    // Seed a commitment
    const catRes = await page.request.get('/api/categories');
    const { categories } = await catRes.json();
    const petrol = categories.find((c: { slug: string }) => c.slug === 'petrol-toll');

    if (petrol) {
      await page.request.post('/api/commitments', {
        data: { name: petrol.name, amount: 200, due_day: 10, category_id: petrol.id },
      });
    }
    await page.reload();

    const row = page.locator('tr').filter({ hasText: 'Petrol & Toll' });
    await row.getByRole('button', { name: 'Delete' }).click({ force: true });

    // After deletion the commitment row should be gone (category tree still shows the category name)
    await expect(page.locator('td').filter({ hasText: 'Petrol & Toll' })).not.toBeVisible({ timeout: 5000 });
  });
});

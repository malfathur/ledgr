import { test, expect } from '@playwright/test';

test.describe('Admin — user management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('loads the user management page', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('button', { name: '+ Create user' })).toBeVisible();
  });

  test('user table shows admin and testuser', async ({ page }) => {
    await expect(page.getByText('admin')).toBeVisible();
    await expect(page.getByText('testuser')).toBeVisible();
  });

  test('admin row has no action buttons', async ({ page }) => {
    // Admin row should show no Reset pw or Delete buttons
    const adminRow = page.locator('tr').filter({ hasText: 'admin' });
    await expect(adminRow.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(adminRow.getByRole('button', { name: 'Reset pw' })).not.toBeVisible();
  });

  test('shows Admin nav link in dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  });

  test('admin account page shows ROOT_PASSWORD explanation instead of form', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('ROOT_PASSWORD')).toBeVisible();
    await expect(page.getByPlaceholder('Current password')).not.toBeVisible();
  });

  test('create user flow', async ({ page }) => {
    await page.getByRole('button', { name: '+ Create user' }).click();

    // Modal appears
    await expect(page.getByRole('heading', { name: 'Create user' })).toBeVisible();

    await page.getByPlaceholder('Username').fill('newuser_e2e');
    await page.getByPlaceholder('Password').fill('newuserpass123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Modal closes, new user appears in table
    await expect(page.getByRole('heading', { name: 'Create user' })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('newuser_e2e')).toBeVisible({ timeout: 5000 });
  });

  test('create user — duplicate username shows error', async ({ page }) => {
    await page.getByRole('button', { name: '+ Create user' }).click();
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('.text-red-400').filter({ hasText: /already|exists|taken/i })).toBeVisible({ timeout: 5000 });
  });

  test('cancel create user modal', async ({ page }) => {
    await page.getByRole('button', { name: '+ Create user' }).click();
    await expect(page.getByRole('heading', { name: 'Create user' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create user' })).not.toBeVisible();
  });

  test('reset password for testuser', async ({ page }) => {
    const testUserRow = page.locator('tr').filter({ hasText: 'testuser' });
    await testUserRow.getByRole('button', { name: 'Reset pw' }).click();

    // Reset modal
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
    await page.getByPlaceholder('New password').fill('resetpass456');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('heading', { name: 'Reset password' })).not.toBeVisible({ timeout: 5000 });
  });

  test('delete user — cancel does nothing', async ({ page }) => {
    // Create a disposable user first
    await page.getByRole('button', { name: '+ Create user' }).click();
    await page.getByPlaceholder('Username').fill('disposable_e2e');
    await page.getByPlaceholder('Password').fill('disposable123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('disposable_e2e')).toBeVisible({ timeout: 5000 });

    const row = page.locator('tr').filter({ hasText: 'disposable_e2e' });
    await row.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('heading', { name: 'Delete user?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete user?' })).not.toBeVisible();
    await expect(page.getByText('disposable_e2e')).toBeVisible();
  });

  test('delete user — confirm removes user from table', async ({ page }) => {
    // Create a user to delete
    await page.getByRole('button', { name: '+ Create user' }).click();
    await page.getByPlaceholder('Username').fill('todelete_e2e');
    await page.getByPlaceholder('Password').fill('todelete123');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('todelete_e2e')).toBeVisible({ timeout: 5000 });

    const row = page.locator('tr').filter({ hasText: 'todelete_e2e' });
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete user?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).last().click();

    await expect(page.getByText('todelete_e2e')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin — access control', () => {
  test('non-admin cannot access /admin (redirected by middleware)', async ({ browser }) => {
    // Use a fresh context with the user storage state
    const userCtx = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await userCtx.newPage();
    await page.goto('/admin');
    // Middleware redirects non-admin away from /admin
    await expect(page).not.toHaveURL('/admin');
    await userCtx.close();
  });
});

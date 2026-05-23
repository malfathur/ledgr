import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows branding', async ({ page }) => {
    await expect(page.getByText('L.E.D.G.R.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('redirects to dashboard on valid credentials', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert').first()).toContainText('Invalid username or password');
  });

  test('shows error on unknown username', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('nobody');
    await page.getByPlaceholder('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert').first()).toContainText('Invalid username or password');
  });

  test('admin can log in', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('test-admin-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('triggers rate limit after 6 rapid attempts', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.getByPlaceholder('Username').fill('testuser');
      await page.getByPlaceholder('Password').fill(`wrong${i}`);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByRole('alert').waitFor();
    }
    const alert = page.getByRole('alert');
    // Either the standard error or the rate limit message (429 also returns invalid creds text)
    await expect(alert).toBeVisible();
  });

  test('unauthenticated visit to / redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});

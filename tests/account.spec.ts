import { test, expect } from '@playwright/test';

test.describe('Account page — regular user', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
  });

  test('shows Change Password section', async ({ page }) => {
    await expect(page.getByText('Change Password')).toBeVisible();
  });

  test('shows the password change form', async ({ page }) => {
    await expect(page.getByPlaceholder('Current password')).toBeVisible();
    await expect(page.getByPlaceholder('New password (min 8 chars)')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm new password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
  });

  test('shows error when current password is wrong', async ({ page }) => {
    await page.getByPlaceholder('Current password').fill('wrongpassword');
    await page.getByPlaceholder('New password (min 8 chars)').fill('newpassword123');
    await page.getByPlaceholder('Confirm new password').fill('newpassword123');
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/password')),
      page.getByRole('button', { name: 'Update Password' }).click(),
    ]);
    expect(response.status()).toBe(403);
    await expect(page.getByText('Current password is incorrect')).toBeVisible();
  });

  test('shows error when new passwords do not match', async ({ page }) => {
    await page.getByPlaceholder('Current password').fill('testpass123');
    await page.getByPlaceholder('New password (min 8 chars)').fill('newpassword123');
    await page.getByPlaceholder('Confirm new password').fill('differentpassword');
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(page.getByText('New passwords do not match')).toBeVisible();
  });

  test('back link navigates to dashboard', async ({ page }) => {
    await page.getByRole('link', { name: '←' }).click();
    await expect(page).toHaveURL('/');
  });
});

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.resolve(__dirname, '.auth');

setup('authenticate as regular user', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('testuser');
  await page.getByPlaceholder('Password').fill('testpass123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');

  // Pre-set a budget for the current month so the dashboard loads without the modal
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const catRes = await page.request.get('/api/categories');
  const { categories } = await catRes.json();
  const primaryIncome = categories.find((c: { slug: string }) => c.slug === 'primary-income');

  if (primaryIncome) {
    await page.request.post('/api/budgets', {
      data: {
        month,
        year,
        budgets: [{ category_id: primaryIncome.id, amount: 5000 }],
      },
    });
  }

  await page.context().storageState({ path: path.join(AUTH_DIR, 'user.json') });
});

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('test-admin-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Admin row is created on first successful login by the app
  await page.waitForURL('/');

  // Pre-set a budget for admin so dashboard loads without modal
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const catRes = await page.request.get('/api/categories');
  const { categories } = await catRes.json();
  const primaryIncome = categories.find((c: { slug: string }) => c.slug === 'primary-income');

  if (primaryIncome) {
    await page.request.post('/api/budgets', {
      data: {
        month,
        year,
        budgets: [{ category_id: primaryIncome.id, amount: 5000 }],
      },
    });
  }

  await page.context().storageState({ path: path.join(AUTH_DIR, 'admin.json') });
});

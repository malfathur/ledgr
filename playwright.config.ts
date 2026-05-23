import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const TEST_DB = path.resolve(__dirname, 'test.db').replace(/\\/g, '/');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:2002',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup/,
    },
    {
      name: 'user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: [
        '**/dashboard.spec.ts',
        '**/add-transaction.spec.ts',
        '**/budget.spec.ts',
        '**/summary.spec.ts',
        '**/history.spec.ts',
        '**/account.spec.ts',
        '**/setup.spec.ts',
      ],
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: ['**/admin.spec.ts'],
    },
    {
      name: 'no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/login.spec.ts'],
    },
  ],
  webServer: {
    command: 'npx next dev --port 2002',
    url: 'http://localhost:2002',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TURSO_URL: `file:${TEST_DB}`,
      TURSO_AUTH_TOKEN: '',
      ROOT_PASSWORD: 'test-admin-password',
      SESSION_SECRET: 'test-session-secret-for-playwright-only',
    },
  },
});

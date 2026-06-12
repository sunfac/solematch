import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the STATIC EXPORT, not the Metro dev server (plan Task 18):
 * deterministic, CI-friendly, and exercises exactly what ships. The `-s` flag
 * on serve gives SPA fallback so deep links don't 404.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run e2e:serve:full',
    url: 'http://localhost:4173',
    timeout: 240_000,
    reuseExistingServer: true,
  },
});

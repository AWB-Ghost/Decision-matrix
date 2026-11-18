import { defineConfig, devices } from '@playwright/test';

const PORT = 4175;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'mobile-chromium', testIgnore: /screenshots\.spec/, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'mobile-webkit', testIgnore: /screenshots\.spec|responsive\.spec/, use: { ...devices['iPhone 14'] } },
    { name: 'desktop-chromium', testIgnore: /screenshots\.spec/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'screenshots', testMatch: /screenshots\.spec/, use: { ...devices['Desktop Chrome'] } },
  ],
});

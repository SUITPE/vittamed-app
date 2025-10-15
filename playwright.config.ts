import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Disable to prevent race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Reduce retries with better stability
  workers: 1, // Use single worker for maximum stability
  reporter: 'html',
  timeout: 60 * 1000, // 1 minute total test timeout (reduced from 2min)
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions (reduced from 15s)
  },
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 30 * 1000, // 30 seconds for actions
    navigationTimeout: 60 * 1000, // 60 seconds for navigation
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Add additional Chrome args for stability
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
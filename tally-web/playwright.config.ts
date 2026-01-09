import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  // Run tests in parallel for speed
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    timezoneId: "UTC",
    colorScheme: "light",
    // Reduce flakiness
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: "bun run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add mobile viewport for responsive testing
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: /.*mobile.*\.spec\.ts/,
    },
  ],
  // Reporter configuration
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 3100",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      CINEWAVE_E2E: "1",
      MINIFLARE_REGISTRY_PATH: ".wrangler/e2e-registry",
      SEPAY_WEBHOOK_API_KEY: "sepay-e2e-secret",
      PAYMENT_BANK_CODE: "VCB",
      PAYMENT_BANK_ACCOUNT: "0000000000",
      PAYMENT_ACCOUNT_NAME: "CINEWAVE E2E",
    },
    stdout: "pipe",
    stderr: "pipe",
  },
});

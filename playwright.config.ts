// E2E (admin plan §9): the real console against the real API and a Postgres test database. Run `make migrate-test` in
// sentriNG-api first. Both servers start on their own ports, so a dev API on :8080 can keep running.
import { defineConfig } from "@playwright/test";

const API_PORT = 8091;
const WEB_PORT = 5186;
// The API's test database. The Go integration tests TRUNCATE it, so don't run both at once
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5432/sentring_test?sslmode=disable";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Any Chromium. Without a path, Playwright's own (`pnpm exec playwright install chromium`)
    launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH || undefined },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "go run .",
      cwd: "../sentriNG-api",
      env: { ADDR: `:${API_PORT}`, DATABASE_URL, GIN_MODE: "release" },
      url: `http://localhost:${API_PORT}/readyz`,
      timeout: 120_000,
    },
    {
      command: `pnpm exec vite dev --port ${WEB_PORT} --strictPort`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
    },
  ],
});

process.env.E2E_DATABASE_URL = DATABASE_URL;
process.env.E2E_API_URL = `http://localhost:${API_PORT}`;

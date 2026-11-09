import { defineConfig, devices } from "@playwright/test";

import { assertE2eDatabaseUrl, isCiEnvironment } from "./scripts/e2e-db-guard.mjs";
import { E2E_ENV } from "./tests/e2e/env";

// Refuse to even start the server against anything but a throwaway database
// (global-setup checks again right before it empties the auth tables).
assertE2eDatabaseUrl(E2E_ENV["E2E_DATABASE_URL"], { ci: isCiEnvironment() });

const baseURL = E2E_ENV["BETTER_AUTH_URL"] ?? "http://localhost:3100";
const port = new URL(baseURL).port || "3100";
// Second server, same build and database, with the sign-up window closed
// (AUTH_SIGNUP_OPEN=false, the production default).
const closedPort = String(Number(port) + 1);
const closedSignUpURL = `http://localhost:${closedPort}`;

/**
 * E2E against a production build (`next start`). Run via `pnpm e2e` from the
 * repo root: it starts the local database, applies migrations and builds.
 * Browsers are not downloaded here; CI installs Chromium itself.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // No retries: the serial auth flow is not retry-safe (the account already exists).
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  projects: [
    // Mobile first: runs every spec, including the sign-up flows.
    { name: "mobil", use: { ...devices["Pixel 7"] }, testIgnore: /(desktop|rate-limit|signup-closed)\.spec\.ts/ },
    // Desktop layout checks run after the mobile project created the user.
    {
      name: "masaustu",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /desktop\.spec\.ts/,
      dependencies: ["mobil"],
    },
    // Exhausts the sign-in rate limit, so it must run after the sign-in tests.
    { name: "rate-limit", testMatch: /rate-limit\.spec\.ts/, dependencies: ["masaustu"] },
    // Sign-up window closed (production default), against the second server.
    {
      name: "kayit-kapali",
      testMatch: /signup-closed\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: closedSignUpURL },
      dependencies: ["rate-limit"],
    },
  ],
  webServer: [
    {
      command: `pnpm exec next start --port ${port}`,
      url: `${baseURL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...E2E_ENV, NEXT_TELEMETRY_DISABLED: "1" },
    },
    {
      command: `pnpm exec next start --port ${closedPort}`,
      url: `${closedSignUpURL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...E2E_ENV,
        AUTH_SIGNUP_OPEN: "false",
        BETTER_AUTH_URL: closedSignUpURL,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});

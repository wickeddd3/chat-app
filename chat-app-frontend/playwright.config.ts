import { defineConfig, devices } from "@playwright/test";

// Load a local .env (if present) so the Supabase URL is available when deriving
// the mock session's storage key. CI provides it as an environment variable.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env (e.g. CI) — rely on the ambient environment.
}

const PORT = 5173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Fail the build if a `test.only` is committed.
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // Public/unauthenticated specs live at the top level of e2e/.
      testIgnore: ["**/authenticated/**"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Authenticated specs mock the Supabase session in-browser, so they need
      // no real user or backend (see e2e/support/authenticated-test.ts).
      name: "authenticated",
      testDir: "./e2e/authenticated",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Boots the Vite dev server for the run; locally it reuses an already
  // running server (e.g. the Docker/dev instance on 5173) instead of spawning
  // a second one.
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

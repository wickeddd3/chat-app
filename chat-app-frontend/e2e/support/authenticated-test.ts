import { test as base, expect } from "@playwright/test";
import { API_URL, STORAGE_KEY, fakeSessionValue } from "./session";

// A `test` whose page arrives already "logged in": a fake Supabase session is
// seeded into localStorage before any app code runs, and every backend call is
// stubbed with an empty-but-valid envelope so nothing returns 401 (which the
// app treats as an expired session and force signs out). Individual specs can
// override specific endpoints by registering their own `page.route` before
// navigating — later routes take precedence.

const emptyApiResponse = {
  success: true,
  message: "ok",
  data: [],
  meta: { limit: 20, hasMore: false, nextCursor: null },
  timestamp: new Date().toISOString(),
};

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ([key, value]) => {
        window.localStorage.setItem(key, value);
      },
      [STORAGE_KEY, fakeSessionValue()] as const,
    );

    // Scoped to the backend origin so the dev server's own Vite modules
    // (some served from `api/` folders) are never intercepted.
    await page.route(`${API_URL}/**`, (route) =>
      route.fulfill({ json: emptyApiResponse }),
    );

    await use(page);
  },
});

export { expect };

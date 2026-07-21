import { test, expect } from "./support/authenticated-test";
import { test as guest, expect as guestExpect } from "@playwright/test";

test.describe("accessibility landmarks and titles", () => {
  test("sets a per-route document title", async ({ page }) => {
    await page.goto("/messages");
    await expect(page).toHaveTitle("Messages · Chikamo");

    await page.goto("/contacts");
    await expect(page).toHaveTitle("Contacts · Chikamo");
  });

  test("announces the route in a live region", async ({ page }) => {
    await page.goto("/notifications");

    const status = page
      .getByRole("status")
      .filter({ hasText: "Notifications" });
    await expect(status).toHaveAttribute("aria-live", "polite");
  });

  test("puts the skip link first in the tab order", async ({ page }) => {
    await page.goto("/messages");
    // The app renders after hydration; evaluate does not auto-wait.
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toBeAttached();

    // Asserted against DOM order rather than by pressing Tab: in headless
    // Chromium focus stays on <body>, so a Tab-based check proves nothing.
    const firstTabbableText = await page.evaluate(() => {
      const tabbable = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      return tabbable[0]?.textContent?.trim();
    });

    expect(firstTabbableText).toBe("Skip to main content");
  });

  test("skip link reveals itself on focus and targets main", async ({
    page,
  }) => {
    await page.goto("/messages");

    const skip = page.getByRole("link", { name: "Skip to main content" });
    await skip.focus();
    // sr-only clips to a 1px box; focus must lift it back to a visible size.
    const box = await skip.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(20);

    await skip.click();
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("has exactly one h1 on a nested chat route", async ({ page }) => {
    await page.goto("/messages");
    // Two h1s used to render here: the inbox heading and the channel header.
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

guest.describe("public pages", () => {
  guest("sign-in exposes a heading and a title", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await guestExpect(page).toHaveTitle("Sign in · Chikamo");
    await guestExpect(
      page.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeVisible();
  });

  guest("sign-up exposes a heading and a title", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await guestExpect(page).toHaveTitle("Create an account · Chikamo");
    await guestExpect(
      page.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeVisible();
  });
});

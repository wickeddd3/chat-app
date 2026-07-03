import { test, expect } from "../support/authenticated-test";

// These run with a mocked Supabase session (see support/authenticated-test).
// They assert only the authenticated app shell (chrome that renders regardless
// of inbox data), so they stay green with the empty stubbed backend.

test.describe("authenticated shell", () => {
  test("lands on the messages inbox after authentication", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/messages/);
    await expect(
      page.getByRole("heading", { name: "Chat Inbox" }),
    ).toBeVisible();
  });

  test("shows the primary navigation", async ({ page }) => {
    await page.goto("/messages");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /Messages/ })).toBeVisible();
  });

  test("opens the account menu modal", async ({ page }) => {
    await page.goto("/messages");

    await page.getByRole("button", { name: "Open account menu" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("navigates to the settings page from the account menu", async ({
    page,
  }) => {
    await page.goto("/messages");

    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL(/\/settings/);
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();
  });
});

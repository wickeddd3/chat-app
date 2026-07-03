import { test, expect } from "../support/authenticated-test";

// Walks the primary sidebar navigation with a mocked session and the fixture's
// empty stubbed backend, asserting each destination renders its own chrome.

test.describe("authenticated navigation", () => {
  test("navigates between primary sections via the sidebar", async ({
    page,
  }) => {
    await page.goto("/messages");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();

    await nav.getByRole("link", { name: "People" }).click();
    await expect(page).toHaveURL(/\/people$/);
    await expect(
      page.getByRole("heading", { name: "People you may know" }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Contacts" }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

    await nav.getByRole("link", { name: "Requests" }).click();
    await expect(page).toHaveURL(/\/contact-requests$/);
    await expect(
      page.getByRole("heading", { name: "Connection Requests" }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Messages" }).click();
    await expect(page).toHaveURL(/\/messages$/);
    await expect(
      page.getByRole("heading", { name: "Chat Inbox" }),
    ).toBeVisible();
  });
});

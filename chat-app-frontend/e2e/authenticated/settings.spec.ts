import { test, expect } from "../support/authenticated-test";

// Client-side flow (no backend): switching the theme from Settings toggles the
// `dark` class on <html> and persists the choice to localStorage.

test.describe("authenticated settings", () => {
  test("switches between light and dark themes", async ({ page }) => {
    await page.goto("/settings");

    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();

    const html = page.locator("html");

    // Default is light.
    await expect(html).not.toHaveClass(/dark/);

    await page.getByText("Dark", { exact: true }).click();
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );

    await page.getByText("Light", { exact: true }).click();
    await expect(html).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "light",
    );
  });

  test("keeps the selected theme after a reload", async ({ page }) => {
    await page.goto("/settings");
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();

    // The anti-flash script applies the stored theme before paint.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

import { test, expect } from "@playwright/test";

// These flows never depend on a live backend: on a fresh browser context there
// is no stored Supabase session, so the auth check resolves to "logged out"
// and form validation is entirely client-side (zod).

test.describe("authentication routes", () => {
  test("redirects an unauthenticated visitor from / to the sign-in page", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Login account" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("shows validation errors when submitting an empty form", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await page.getByRole("button", { name: "Login account" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password required")).toBeVisible();
    // No navigation happened.
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  });

  test("flags a malformed email address", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("supersecret");
    await page.getByRole("button", { name: "Login account" }).click();

    // The email field is marked invalid without asserting on exact copy.
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  });

  test("navigates to the sign-up page from the sign-in link", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await page.getByRole("link", { name: "Sign up" }).click();

    await expect(page).toHaveURL(/\/auth\/sign-up$/);
  });
});

test.describe("catch-all route", () => {
  test("shows the 404 page for an unknown path", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByText("404 | Page Not Found")).toBeVisible();
  });
});

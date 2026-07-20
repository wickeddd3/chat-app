import { test, expect } from "../support/authenticated-test";
import { API_URL } from "../support/session";

// Drives the People page against stubbed users so the connectionStatus -> action
// button mapping is verified end-to-end in a real browser.

const now = new Date().toISOString();

function envelope(data: unknown) {
  return {
    success: true,
    message: "ok",
    data,
    meta: { limit: 20, hasMore: false, nextCursor: null },
    timestamp: now,
  };
}

const users = [
  {
    id: "u1",
    name: "Stranger One",
    username: "stranger1",
    connectionStatus: "STRANGER",
    connectionId: null,
  },
  {
    id: "u2",
    name: "Contact Two",
    username: "contact2",
    connectionStatus: "CONTACT",
    connectionId: null,
  },
];

test.describe("authenticated people list (stubbed API)", () => {
  test("renders the status-appropriate action for each person", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/users*`, (route) =>
      route.fulfill({ json: envelope(users) }),
    );

    await page.goto("/people");

    await expect(
      page.getByRole("heading", { name: "People you may know" }),
    ).toBeVisible();

    // Stranger -> "Add Contact" (send request); contact -> "Message".
    await expect(page.getByText("Stranger One")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send connection request" }),
    ).toBeVisible();

    await expect(page.getByText("Contact Two")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send message" }),
    ).toBeVisible();
  });

  test("shows the empty state when there are no people", async ({ page }) => {
    await page.route(`${API_URL}/api/users*`, (route) =>
      route.fulfill({ json: envelope([]) }),
    );

    await page.goto("/people");

    await expect(page.getByText("No one to show yet")).toBeVisible();
  });

  test("shows the search-specific empty state when a search finds nobody", async ({
    page,
  }) => {
    // Everyone is returned until a query is sent, so the list is only empty
    // because of the search — which is the distinction being asserted.
    await page.route(`${API_URL}/api/users*`, (route) => {
      const hasQuery = new URL(route.request().url()).searchParams.has("query");
      return route.fulfill({ json: envelope(hasQuery ? [] : users) });
    });

    await page.goto("/people");
    await expect(page.getByText("Stranger One")).toBeVisible();

    await page.getByRole("textbox", { name: "Search" }).fill("zzzz");

    // The search is debounced, so Playwright waits this out on its own.
    await expect(page.getByText("No people found")).toBeVisible();
    await expect(page.getByText(/zzzz/)).toBeVisible();
    await expect(page.getByText("No one to show yet")).toBeHidden();
  });
});

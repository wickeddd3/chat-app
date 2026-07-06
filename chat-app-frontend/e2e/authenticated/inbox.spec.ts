import { test, expect } from "../support/authenticated-test";
import { API_URL } from "../support/session";

// Runs with a mocked Supabase session (see support/authenticated-test) and
// overrides the inbox endpoint so the rendered data is deterministic. The
// per-test route below takes precedence over the fixture's catch-all stub.

const now = new Date().toISOString();

const channelsResponse = {
  success: true,
  message: "ok",
  data: [
    {
      id: "chan-1",
      name: "Alice",
      type: "DIRECT",
      displayName: "Alice Doe",
      displayImage: "",
      channelMembers: [],
      lastMessage: { content: "Hey there", createdAt: now },
      messages: [],
      recipient: null,
      unreadCount: 0,
    },
    {
      id: "chan-2",
      name: "Bob",
      type: "DIRECT",
      displayName: "Bob Smith",
      displayImage: "",
      channelMembers: [],
      lastMessage: { content: "See you soon", createdAt: now },
      messages: [],
      recipient: null,
      unreadCount: 2,
    },
  ],
  meta: { limit: 20, hasMore: false, nextCursor: null },
  timestamp: now,
};

const emptyResponse = {
  success: true,
  message: "ok",
  data: [],
  meta: { limit: 20, hasMore: false, nextCursor: null },
  timestamp: now,
};

test.describe("authenticated inbox (stubbed API)", () => {
  test("renders the channels returned by the API", async ({ page }) => {
    await page.route(`${API_URL}/api/channels*`, (route) =>
      route.fulfill({ json: channelsResponse }),
    );

    await page.goto("/messages");

    await expect(page.getByText("Alice Doe")).toBeVisible();
    await expect(page.getByText("Bob Smith")).toBeVisible();
    // Bob has 2 unread -> the item summarizes the count instead of the message.
    await expect(page.getByText("2 unread messages")).toBeVisible();
  });

  test("shows the empty placeholder when the API returns no channels", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/channels*`, (route) =>
      route.fulfill({ json: emptyResponse }),
    );

    await page.goto("/messages");

    await expect(page.getByText("No conversations yet")).toBeVisible();
    await expect(page.getByText("Alice Doe")).toBeHidden();
  });
});

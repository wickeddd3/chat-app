import { test, expect } from "../support/authenticated-test";
import { API_URL, TEST_USER } from "../support/session";

// Opens a channel with a mocked session and stubbed channel + message
// endpoints, so the whole chat-room pipeline (header, virtualized message list,
// bubbles) is exercised end-to-end against deterministic data.

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

const channel = {
  id: "chan-1",
  name: "Alice",
  type: "DIRECT",
  displayName: "Alice Doe",
  displayImage: "",
  channelMembers: [
    {
      id: 1,
      role: "MEMBER",
      user: { id: "alice", name: "Alice Doe", image: null, username: "alice" },
    },
    {
      id: 2,
      role: "MEMBER",
      user: { id: TEST_USER.id, name: TEST_USER.name, image: null, username: "me" },
    },
  ],
  lastMessage: { content: "Hi from Alice", createdAt: now },
  messages: [],
  recipient: null,
};

const messages = [
  {
    id: "m-1",
    author: { id: "alice", name: "Alice Doe", image: null },
    content: "Hi from Alice",
    createdAt: now,
    authorId: "alice",
    channelId: 1,
    parentId: "",
  },
  {
    id: "m-2",
    author: { id: TEST_USER.id, name: TEST_USER.name, image: null },
    content: "Hi from me",
    createdAt: now,
    authorId: TEST_USER.id,
    channelId: 1,
    parentId: "",
  },
];

test.describe("authenticated chat room (stubbed API)", () => {
  test("opens a channel and renders its header and messages", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/channels/*`, (route) =>
      route.fulfill({ json: envelope(channel) }),
    );
    await page.route(`${API_URL}/api/messages/*`, (route) =>
      route.fulfill({ json: envelope(messages) }),
    );

    await page.goto("/messages/chan-1");

    await expect(
      page.getByRole("heading", { name: "Alice Doe" }),
    ).toBeVisible();
    await expect(page.getByText("Hi from Alice")).toBeVisible();
    await expect(page.getByText("Hi from me")).toBeVisible();
  });

  test("shows the empty state for a channel with no messages", async ({
    page,
  }) => {
    await page.route(`${API_URL}/api/channels/*`, (route) =>
      route.fulfill({ json: envelope(channel) }),
    );
    await page.route(`${API_URL}/api/messages/*`, (route) =>
      route.fulfill({ json: envelope([]) }),
    );

    await page.goto("/messages/chan-1");

    await expect(page.getByText("No messages yet")).toBeVisible();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ChatInboxItem } from "./ChatInboxItem";
import type { InboxChannel } from "@/entities/channel";

const { markAsReadMock, useTypingUsersMock } = vi.hoisted(() => ({
  markAsReadMock: vi.fn(),
  useTypingUsersMock: vi.fn(),
}));

vi.mock("../model/useMarkAsRead", () => ({
  useMarkAsRead: () => ({ markAsRead: markAsReadMock }),
}));

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-user" } }),
}));

vi.mock("@/entities/message", () => ({
  useTypingUsers: useTypingUsersMock,
}));

function inboxItem(overrides: Partial<InboxChannel> = {}): InboxChannel {
  return {
    id: "chan-1",
    name: "Chan",
    type: "DIRECT",
    displayName: "Jane Doe",
    displayImage: "",
    channelMembers: [],
    lastMessage: {
      content: "See you soon",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    messages: [],
    recipient: null,
    unreadCount: 0,
    online: false,
    ...overrides,
  };
}

function renderItem(item: InboxChannel) {
  return render(
    <MemoryRouter>
      <ChatInboxItem inboxItem={item} />
    </MemoryRouter>,
  );
}

describe("ChatInboxItem", () => {
  beforeEach(() => {
    useTypingUsersMock.mockReturnValue({ isTyping: false, label: "" });
  });

  it("renders the display name and last message when read", () => {
    renderItem(inboxItem());

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("See you soon")).toBeInTheDocument();
    expect(screen.queryByLabelText("Unread indicator")).not.toBeInTheDocument();
  });

  it("shows the unread indicator and last message with a single unread", () => {
    renderItem(inboxItem({ unreadCount: 1 }));

    expect(screen.getByText("See you soon")).toBeInTheDocument();
    expect(screen.getByLabelText("Unread indicator")).toBeInTheDocument();
  });

  it("summarizes the count when more than one message is unread", () => {
    renderItem(inboxItem({ unreadCount: 3 }));

    expect(screen.getByText("3 unread messages")).toBeInTheDocument();
    expect(screen.queryByText("See you soon")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Unread indicator")).toBeInTheDocument();
  });

  it("replaces the preview with the typing label", () => {
    useTypingUsersMock.mockReturnValue({
      isTyping: true,
      label: "Jane is typing",
    });

    renderItem(inboxItem());

    expect(screen.getByText("Jane is typing")).toBeInTheDocument();
    expect(screen.queryByText("See you soon")).not.toBeInTheDocument();
  });

  it("outranks the unread summary but keeps the unread indicator", () => {
    useTypingUsersMock.mockReturnValue({
      isTyping: true,
      label: "Jane is typing",
    });

    renderItem(inboxItem({ unreadCount: 3 }));

    expect(screen.getByText("Jane is typing")).toBeInTheDocument();
    expect(screen.queryByText("3 unread messages")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Unread indicator")).toBeInTheDocument();
  });

  it("names a photo sent without a caption, rather than leaving the row blank", () => {
    renderItem(
      inboxItem({
        lastMessage: {
          content: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          hasImage: true,
        },
      }),
    );

    expect(screen.getByText("📷 Photo")).toBeInTheDocument();
  });

  it("prefers a photo's caption over the generic label", () => {
    renderItem(
      inboxItem({
        lastMessage: {
          content: "sunset tonight",
          createdAt: "2026-01-01T00:00:00.000Z",
          hasImage: true,
        },
      }),
    );

    expect(screen.getByText("sunset tonight")).toBeInTheDocument();
    expect(screen.queryByText("📷 Photo")).not.toBeInTheDocument();
  });

  it("shows typing in a channel that has no messages yet", () => {
    useTypingUsersMock.mockReturnValue({
      isTyping: true,
      label: "Jane is typing",
    });

    renderItem(inboxItem({ lastMessage: null }));

    expect(screen.getByText("Jane is typing")).toBeInTheDocument();
  });

  it("resolves typists against the members the row already holds", () => {
    renderItem(
      inboxItem({
        channelMembers: [
          {
            id: "membership-1",
            role: "MEMBER",
            user: {
              id: "user-2",
              name: "Jane",
              image: null,
              username: "jane",
            },
          },
        ],
      }),
    );

    expect(useTypingUsersMock).toHaveBeenCalledWith({
      channelId: "chan-1",
      authId: "auth-user",
      participants: [
        { id: "user-2", name: "Jane", image: null, username: "jane" },
      ],
    });
  });

  it("links to the channel and marks it read on click", async () => {
    const user = userEvent.setup();
    renderItem(inboxItem());

    const link = screen.getByRole("link", { name: /Jane Doe/ });
    expect(link).toHaveAttribute("href", "/messages/chan-1");

    await user.click(link);

    expect(markAsReadMock).toHaveBeenCalled();
  });
});

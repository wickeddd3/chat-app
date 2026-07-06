import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ChatInboxItem } from "./ChatInboxItem";
import type { InboxChannel } from "@/entities/channel";

const { markAsReadMock } = vi.hoisted(() => ({ markAsReadMock: vi.fn() }));

vi.mock("../model/useMarkAsRead", () => ({
  useMarkAsRead: () => ({ markAsRead: markAsReadMock }),
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

  it("links to the channel and marks it read on click", async () => {
    const user = userEvent.setup();
    renderItem(inboxItem());

    const link = screen.getByRole("link", { name: /Jane Doe/ });
    expect(link).toHaveAttribute("href", "/messages/chan-1");

    await user.click(link);

    expect(markAsReadMock).toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import { MessageHeader } from "./MessageHeader";
import type { ChannelMember, InboxChannel } from "@/entities/channel";

const { isOnlineMock } = vi.hoisted(() => ({ isOnlineMock: vi.fn() }));

vi.mock("@/entities/auth", () => ({
  usePresence: () => ({ isOnline: isOnlineMock }),
}));

function member(id: string): ChannelMember {
  return {
    id,
    role: "MEMBER",
    user: { id, name: `User ${id}`, image: null, username: id },
  };
}

function channel(overrides: Partial<InboxChannel> = {}): InboxChannel {
  return {
    id: "chan-1",
    name: "Chan",
    type: "GROUP",
    displayName: "Team Chat",
    displayImage: "",
    channelMembers: [member("u2"), member("u3")],
    lastMessage: { content: "", createdAt: "2026-01-01T00:00:00.000Z" },
    messages: [],
    recipient: null,
    ...overrides,
  };
}

describe("MessageHeader", () => {
  it("renders the channel display name", () => {
    isOnlineMock.mockReturnValue(false);

    render(<MessageHeader channel={channel()} authId="auth-1" />);

    expect(
      screen.getByRole("heading", { name: "Team Chat" }),
    ).toBeInTheDocument();
  });

  it("marks a group online when any member is online", () => {
    isOnlineMock.mockImplementation((id: string) => id === "u3");

    const { container } = render(
      <MessageHeader channel={channel()} authId="auth-1" />,
    );

    expect(container.querySelector(".bg-green-600")).toBeInTheDocument();
  });

  it("marks a group offline when no member is online", () => {
    isOnlineMock.mockReturnValue(false);

    const { container } = render(
      <MessageHeader channel={channel()} authId="auth-1" />,
    );

    expect(container.querySelector(".bg-green-600")).not.toBeInTheDocument();
  });

  it("ignores the current user when resolving direct-channel presence", () => {
    // Only the authenticated user is online -> the header should read offline.
    isOnlineMock.mockImplementation((id: string) => id === "auth-1");

    const { container } = render(
      <MessageHeader
        channel={channel({
          type: "DIRECT",
          channelMembers: [member("auth-1"), member("u2")],
        })}
        authId="auth-1"
      />,
    );

    expect(container.querySelector(".bg-green-600")).not.toBeInTheDocument();
  });

  it("renders safely when there is no channel", () => {
    isOnlineMock.mockReturnValue(false);

    render(<MessageHeader channel={null} authId="auth-1" />);

    expect(screen.queryByText("Team Chat")).not.toBeInTheDocument();
  });
});

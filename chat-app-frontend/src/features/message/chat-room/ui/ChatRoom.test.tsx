import { render, screen } from "@testing-library/react";
import { ChatRoom } from "./ChatRoom";
import type { InboxChannel } from "@/entities/channel";

const { useChannelMock } = vi.hoisted(() => ({
  useChannelMock: vi.fn(),
}));

// The room is driven entirely by the channel it renders; everything below it
// (messages, socket lifecycle, composer internals) is stubbed so the test isolates
// the one decision under test — composer or notice.
vi.mock("@/entities/channel", () => ({ useChannel: useChannelMock }));
vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "me" } }),
}));
vi.mock("../model/useMessages", () => ({
  useMessages: () => ({
    messages: [],
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}));
vi.mock("../model/useChatRoom", () => ({ useChatRoom: vi.fn() }));
vi.mock("./MessageInput", () => ({
  MessageInput: () => <div data-testid="composer" />,
}));
vi.mock("./TypingIndicator", () => ({
  TypingIndicator: () => <div data-testid="typing" />,
}));

function givenChannel(overrides: Partial<InboxChannel>) {
  useChannelMock.mockReturnValue({
    channel: {
      id: "c1",
      type: "DIRECT",
      recipient: { id: "them", name: "Jane", username: "jane", image: null },
      ...overrides,
    },
    isLoading: false,
    error: null,
  });
}

describe("ChatRoom", () => {
  it("shows the composer while the two are still connected", () => {
    givenChannel({ canMessage: true });

    render(<ChatRoom channelId="c1" />);

    expect(screen.getByTestId("composer")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("replaces the composer with a notice once the contact is removed", () => {
    givenChannel({ canMessage: false });

    render(<ChatRoom channelId="c1" />);

    expect(screen.queryByTestId("composer")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /no longer connected .* can't message each other anymore/i,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Jane/);
  });

  it("hides the typing indicator on a closed thread — nobody can type there", () => {
    givenChannel({ canMessage: false });

    render(<ChatRoom channelId="c1" />);

    expect(screen.queryByTestId("typing")).not.toBeInTheDocument();
  });

  it("keeps the composer when the flag is absent, so it never flickers mid-fetch", () => {
    givenChannel({});

    render(<ChatRoom channelId="c1" />);

    expect(screen.getByTestId("composer")).toBeInTheDocument();
  });
});

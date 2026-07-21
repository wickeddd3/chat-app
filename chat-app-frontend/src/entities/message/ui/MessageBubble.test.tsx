import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../model/message.types";

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "m-1",
    author: { id: "user-1", name: "Jane", image: null },
    content: "Hello there",
    createdAt: "2026-01-01T00:00:00.000Z",
    authorId: "user-1",
    channelId: "channel-1",
    parentId: "",
    ...overrides,
  };
}

// Radix only swaps in the <img> once the source loads, which never happens in
// jsdom — so assert on the avatar root, which always renders.
const avatarOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="avatar"]');

describe("MessageBubble", () => {
  it("renders the content", () => {
    render(<MessageBubble message={message()} isAuthorsMessage={false} />);

    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows the delivery check icon only on the author's own messages", () => {
    const { container: own } = render(
      <MessageBubble message={message()} isAuthorsMessage />,
    );
    expect(own.querySelector("svg")).toBeInTheDocument();

    const { container: other } = render(
      <MessageBubble message={message()} isAuthorsMessage={false} />,
    );
    expect(other.querySelector("svg")).not.toBeInTheDocument();
  });

  describe("delivery state", () => {
    it("reports a message still in flight as sending", () => {
      render(
        <MessageBubble
          message={message({ isSending: true })}
          isAuthorsMessage
        />,
      );

      expect(screen.getByRole("img", { name: "Sending" })).toBeInTheDocument();
    });

    it("reports a stored but unread message as delivered", () => {
      render(
        <MessageBubble
          message={message({ isSending: false, readCount: 0 })}
          isAuthorsMessage
        />,
      );

      expect(
        screen.getByRole("img", { name: "Delivered" }),
      ).toBeInTheDocument();
    });

    it("reports a message as read once a recipient has seen it", () => {
      render(
        <MessageBubble message={message({ readCount: 1 })} isAuthorsMessage />,
      );

      expect(screen.getByRole("img", { name: "Read" })).toBeInTheDocument();
    });

    it("treats a message with no tally as delivered rather than read", () => {
      render(<MessageBubble message={message()} isAuthorsMessage />);

      expect(
        screen.getByRole("img", { name: "Delivered" }),
      ).toBeInTheDocument();
    });

    it("keeps showing sending until the send settles, however it was read", () => {
      render(
        <MessageBubble
          message={message({ isSending: true, readCount: 2 })}
          isAuthorsMessage
        />,
      );

      expect(screen.getByRole("img", { name: "Sending" })).toBeInTheDocument();
    });
  });

  it("renders with the entrance animation enabled without crashing", () => {
    render(
      <MessageBubble message={message()} isAuthorsMessage={false} animate />,
    );

    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  describe("author name", () => {
    it("names an incoming author when the channel asks for it", () => {
      render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          showAuthorName
        />,
      );

      expect(screen.getByText("Jane")).toBeInTheDocument();
    });

    it("stays unnamed in a direct thread", () => {
      render(<MessageBubble message={message()} isAuthorsMessage={false} />);

      expect(screen.queryByText("Jane")).not.toBeInTheDocument();
    });

    it("never names the reader's own messages", () => {
      render(
        <MessageBubble message={message()} isAuthorsMessage showAuthorName />,
      );

      expect(screen.queryByText("Jane")).not.toBeInTheDocument();
    });

    it("names only the top of a run", () => {
      render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          position="mid"
          showAuthorName
        />,
      );

      expect(screen.queryByText("Jane")).not.toBeInTheDocument();
    });
  });

  describe("run position", () => {
    it("shows the avatar at the top of an incoming run", () => {
      const { container } = render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          position="first"
        />,
      );

      expect(avatarOf(container)).toBeInTheDocument();
    });

    it("hides the avatar on continuations of a run", () => {
      const { container: mid } = render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          position="mid"
        />,
      );
      expect(avatarOf(mid)).not.toBeInTheDocument();

      const { container: last } = render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          position="last"
        />,
      );
      expect(avatarOf(last)).not.toBeInTheDocument();
    });

    it("never shows an avatar on the reader's own side", () => {
      const { container } = render(
        <MessageBubble message={message()} isAuthorsMessage position="first" />,
      );

      expect(avatarOf(container)).not.toBeInTheDocument();
    });

    it("shows the delivery state only at the bottom of a run", () => {
      const { container: mid } = render(
        <MessageBubble message={message()} isAuthorsMessage position="mid" />,
      );
      expect(mid.querySelector("svg")).not.toBeInTheDocument();

      const { container: last } = render(
        <MessageBubble message={message()} isAuthorsMessage position="last" />,
      );
      expect(last.querySelector("svg")).toBeInTheDocument();
    });

    it("treats a lone message as both the top and bottom of its run", () => {
      const { container } = render(
        <MessageBubble
          message={message()}
          isAuthorsMessage={false}
          position="solo"
          showAuthorName
        />,
      );

      expect(avatarOf(container)).toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  });
});

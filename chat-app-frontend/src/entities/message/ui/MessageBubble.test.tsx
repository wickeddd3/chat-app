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
    channelId: 1,
    parentId: "",
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders the content and author name", () => {
    render(<MessageBubble message={message()} isAuthorsMessage={false} />);

    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
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

  it("pulses the check icon while the message is still sending", () => {
    const { container } = render(
      <MessageBubble
        message={message({ isSending: true })}
        isAuthorsMessage
      />,
    );

    expect(container.querySelector("svg.animate-pulse")).toBeInTheDocument();
  });

  it("stops pulsing once the message is delivered", () => {
    const { container } = render(
      <MessageBubble
        message={message({ isSending: false })}
        isAuthorsMessage
      />,
    );

    expect(container.querySelector("svg.animate-pulse")).not.toBeInTheDocument();
  });

  it("renders with the entrance animation enabled without crashing", () => {
    render(
      <MessageBubble message={message()} isAuthorsMessage={false} animate />,
    );

    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});

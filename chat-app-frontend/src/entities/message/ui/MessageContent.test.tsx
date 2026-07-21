import { render, screen } from "@testing-library/react";
import { MessageContent } from "./MessageContent";

describe("MessageContent", () => {
  it("renders plain text unchanged", () => {
    render(<MessageContent content="no links here" isAuthorsMessage={false} />);

    expect(screen.getByText("no links here")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links a url and keeps the sentence around it", () => {
    const { container } = render(
      <MessageContent
        content="ship it: https://example.com/pr/79 today"
        isAuthorsMessage={false}
      />,
    );

    const link = screen.getByRole("link", {
      name: "https://example.com/pr/79",
    });
    expect(link).toHaveAttribute("href", "https://example.com/pr/79");
    expect(container).toHaveTextContent(
      "ship it: https://example.com/pr/79 today",
    );
  });

  it("opens links away from the conversation, without handing over the opener", () => {
    render(
      <MessageContent content="https://example.com" isAuthorsMessage={false} />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never renders an unsafe scheme as a link", () => {
    render(
      <MessageContent
        content="javascript:alert(document.cookie)"
        isAuthorsMessage={false}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByText("javascript:alert(document.cookie)"),
    ).toBeInTheDocument();
  });

  it("tints an incoming link but leans on weight inside the reader's own bubble", () => {
    const { unmount } = render(
      <MessageContent content="https://example.com" isAuthorsMessage={false} />,
    );
    expect(screen.getByRole("link")).toHaveClass("text-primary");

    unmount();

    render(<MessageContent content="https://example.com" isAuthorsMessage />);
    expect(screen.getByRole("link")).not.toHaveClass("text-primary");
  });

  it("renders markup in the content as text, not as elements", () => {
    const { container } = render(
      <MessageContent
        content="<img src=x onerror=alert(1)>"
        isAuthorsMessage={false}
      />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container).toHaveTextContent("<img src=x onerror=alert(1)>");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotedMessage } from "./QuotedMessage";
import type { MessageParent } from "../model/message.types";

function parent(overrides: Partial<MessageParent> = {}): MessageParent {
  return {
    id: "m-0",
    content: "Did the migration land?",
    author: { id: "user-2", name: "Jane", image: null },
    ...overrides,
  };
}

describe("QuotedMessage", () => {
  it("names the quoted author and shows what they said", () => {
    render(<QuotedMessage parent={parent()} isOwnParent={false} />);

    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Did the migration land?")).toBeInTheDocument();
  });

  it("attributes the reader's own message to them", () => {
    render(<QuotedMessage parent={parent()} isOwnParent />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByText("Jane")).not.toBeInTheDocument();
  });

  it("labels a quoted system line as narration rather than naming an author", () => {
    // A system line carries the member it is about as its author, so naming
    // them would read as if they had written it.
    render(
      <QuotedMessage
        parent={parent({ type: "SYSTEM", content: "Jane left the group" })}
        isOwnParent={false}
      />,
    );

    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.queryByText("Jane")).not.toBeInTheDocument();
  });

  it("is a button that jumps to the original when a handler is given", async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(
      <QuotedMessage parent={parent()} isOwnParent={false} onJump={onJump} />,
    );

    await user.click(screen.getByRole("button"));

    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it("renders inert without a handler, so the composer preview is not clickable", () => {
    render(<QuotedMessage parent={parent()} isOwnParent={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

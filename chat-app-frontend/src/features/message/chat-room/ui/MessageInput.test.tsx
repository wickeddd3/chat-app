import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "./MessageInput";

const { setMessageMock, sendMessageMock, useSendMessageMock } = vi.hoisted(
  () => {
    const setMessageMock = vi.fn();
    const sendMessageMock = vi.fn((e?: { preventDefault?: () => void }) =>
      e?.preventDefault?.(),
    );
    return {
      setMessageMock,
      sendMessageMock,
      useSendMessageMock: vi.fn(() => ({
        message: "",
        setMessage: setMessageMock,
        sendMessage: sendMessageMock,
      })),
    };
  },
);

vi.mock("../model/useSendMessage", () => ({
  useSendMessage: useSendMessageMock,
}));

/** The send button reflects whether the draft has content, so tests set it. */
function withDraft(message: string) {
  useSendMessageMock.mockReturnValue({
    message,
    setMessage: setMessageMock,
    sendMessage: sendMessageMock,
  });
}

describe("MessageInput", () => {
  beforeEach(() => {
    withDraft("");
  });
  it("renders the labelled input and send button", () => {
    render(<MessageInput channelId="c-1" />);

    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
  });

  it("scopes the send hook to the channel", () => {
    render(<MessageInput channelId="c-1" />);

    expect(useSendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: "c-1" }),
    );
  });

  it("updates the draft as the user types", async () => {
    const user = userEvent.setup();
    render(<MessageInput channelId="c-1" />);

    await user.type(screen.getByLabelText("Message"), "h");

    expect(setMessageMock).toHaveBeenCalledWith("h");
  });

  it("submits the message when the send button is clicked", async () => {
    const user = userEvent.setup();
    withDraft("hello");
    render(<MessageInput channelId="c-1" />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(sendMessageMock).toHaveBeenCalled();
  });

  it("disables sending while the draft is empty", () => {
    render(<MessageInput channelId="c-1" />);

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("treats a whitespace-only draft as empty", () => {
    withDraft("   ");
    render(<MessageInput channelId="c-1" />);

    // Matches the hook, which refuses to send a blank message.
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("enables sending once the draft has content", () => {
    withDraft("hi");
    render(<MessageInput channelId="c-1" />);

    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("inserts a picked emoji into the draft", async () => {
    const user = userEvent.setup();
    render(<MessageInput channelId="c-1" />);

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.click(screen.getByRole("button", { name: "😀" }));

    // message is "" (mocked), so the emoji is inserted at the start.
    expect(setMessageMock).toHaveBeenCalledWith("😀");
  });

  describe("replying", () => {
    const replyTarget = {
      id: "m-0",
      content: "Did the migration land?",
      author: { id: "user-2", name: "Ada", image: null },
    };

    it("shows no reply bar until a message is staged", () => {
      render(<MessageInput channelId="c-1" />);

      expect(
        screen.queryByRole("button", { name: "Cancel reply" }),
      ).not.toBeInTheDocument();
    });

    it("previews the staged message and says who it is from", () => {
      render(<MessageInput channelId="c-1" replyTarget={replyTarget} />);

      expect(screen.getByText("Did the migration land?")).toBeInTheDocument();
      expect(screen.getByText("Ada")).toBeInTheDocument();
    });

    it("attributes the reader's own staged message to them", () => {
      render(
        <MessageInput channelId="c-1" replyTarget={replyTarget} isOwnReplyTarget />,
      );

      expect(screen.getByText("You")).toBeInTheDocument();
    });

    it("hands the staged reply to the send hook", () => {
      render(<MessageInput channelId="c-1" replyTarget={replyTarget} />);

      expect(useSendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ replyTarget }),
      );
    });

    it("backs out of the reply when the bar is dismissed", async () => {
      const user = userEvent.setup();
      const onCancelReply = vi.fn();
      render(
        <MessageInput
          channelId="c-1"
          replyTarget={replyTarget}
          onCancelReply={onCancelReply}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Cancel reply" }));

      expect(onCancelReply).toHaveBeenCalledTimes(1);
    });

    it("backs out of the reply on Escape, leaving the draft text alone", async () => {
      const user = userEvent.setup();
      const onCancelReply = vi.fn();
      withDraft("half-written");
      render(
        <MessageInput
          channelId="c-1"
          replyTarget={replyTarget}
          onCancelReply={onCancelReply}
        />,
      );

      await user.type(screen.getByLabelText("Message"), "{Escape}");

      expect(onCancelReply).toHaveBeenCalledTimes(1);
      expect(setMessageMock).not.toHaveBeenCalledWith("");
    });

    it("puts the caret in the composer as soon as a reply is staged", () => {
      const { rerender } = render(<MessageInput channelId="c-1" />);

      rerender(<MessageInput channelId="c-1" replyTarget={replyTarget} />);

      expect(screen.getByLabelText("Message")).toHaveFocus();
    });
  });
});

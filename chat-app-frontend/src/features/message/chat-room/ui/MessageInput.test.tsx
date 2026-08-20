import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput, type MessageInputProps } from "./MessageInput";
import type { ImageAttachment } from "../model/useImageAttachment";

const onMessageChange = vi.fn();
const onSubmit = vi.fn((e?: { preventDefault?: () => void }) =>
  e?.preventDefault?.(),
);

/** The composer is presentational — the draft and its send come from the room. */
function renderInput(overrides: Partial<MessageInputProps> = {}) {
  const props: MessageInputProps = {
    channelId: "c-1",
    message: "",
    onMessageChange,
    onSubmit,
    ...overrides,
  };

  return render(<MessageInput {...props} />);
}

const replyTarget = {
  id: "m-0",
  content: "Did the migration land?",
  author: { id: "user-2", name: "Ada", image: null },
};

function imageAttachment(): ImageAttachment {
  return {
    file: new File(["x"], "sunset.jpg", { type: "image/jpeg" }),
    previewUrl: "blob:preview",
    width: 1200,
    height: 800,
  };
}

describe("MessageInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the labelled input and send button", () => {
    renderInput();

    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
  });

  it("reports what the user types back to the room", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.type(screen.getByLabelText("Message"), "h");

    expect(onMessageChange).toHaveBeenCalledWith("h");
  });

  it("submits the message when the send button is clicked", async () => {
    const user = userEvent.setup();
    renderInput({ message: "hello" });

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables sending while the draft is empty", () => {
    renderInput();

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("treats a whitespace-only draft as empty", () => {
    renderInput({ message: "   " });

    // Matches the hook, which refuses to send a blank message.
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("enables sending once the draft has content", () => {
    renderInput({ message: "hi" });

    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("inserts a picked emoji into the draft", async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.click(screen.getByRole("button", { name: "😀" }));

    // message is "", so the emoji is inserted at the start.
    expect(onMessageChange).toHaveBeenCalledWith("😀");
  });

  describe("replying", () => {
    it("shows no reply bar until a message is staged", () => {
      renderInput();

      expect(
        screen.queryByRole("button", { name: "Cancel reply" }),
      ).not.toBeInTheDocument();
    });

    it("previews the staged message and says who it is from", () => {
      renderInput({ replyTarget });

      expect(screen.getByText("Did the migration land?")).toBeInTheDocument();
      expect(screen.getByText("Ada")).toBeInTheDocument();
    });

    it("attributes the reader's own staged message to them", () => {
      renderInput({ replyTarget, isOwnReplyTarget: true });

      expect(screen.getByText("You")).toBeInTheDocument();
    });

    it("backs out of the reply when the bar is dismissed", async () => {
      const user = userEvent.setup();
      const onCancelReply = vi.fn();
      renderInput({ replyTarget, onCancelReply });

      await user.click(screen.getByRole("button", { name: "Cancel reply" }));

      expect(onCancelReply).toHaveBeenCalledTimes(1);
    });

    it("backs out of the reply on Escape, leaving the draft text alone", async () => {
      const user = userEvent.setup();
      const onCancelReply = vi.fn();
      renderInput({ replyTarget, onCancelReply, message: "half-written" });

      await user.type(screen.getByLabelText("Message"), "{Escape}");

      expect(onCancelReply).toHaveBeenCalledTimes(1);
      expect(onMessageChange).not.toHaveBeenCalledWith("");
    });

    it("puts the caret in the composer as soon as a reply is staged", () => {
      const { rerender } = renderInput();

      rerender(
        <MessageInput
          channelId="c-1"
          message=""
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
          replyTarget={replyTarget}
        />,
      );

      expect(screen.getByLabelText("Message")).toHaveFocus();
    });
  });

  describe("attaching a photo", () => {
    it("offers no attach button when the room cannot take one", () => {
      renderInput();

      expect(
        screen.queryByRole("button", { name: "Attach a photo" }),
      ).not.toBeInTheDocument();
    });

    it("hands a picked file to the room", async () => {
      const user = userEvent.setup();
      const onAttachImage = vi.fn();
      const { container } = renderInput({ onAttachImage });

      const file = new File(["x"], "sunset.jpg", { type: "image/jpeg" });
      const input = container.querySelector<HTMLInputElement>(
        "#message-image-input",
      );
      await user.upload(input as HTMLInputElement, file);

      expect(onAttachImage).toHaveBeenCalledWith(file);
    });

    it("previews the staged photo by name", () => {
      renderInput({ attachment: imageAttachment(), onAttachImage: vi.fn() });

      expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
    });

    it("drops the staged photo when the preview is dismissed", async () => {
      const user = userEvent.setup();
      const onRemoveAttachment = vi.fn();
      renderInput({
        attachment: imageAttachment(),
        onAttachImage: vi.fn(),
        onRemoveAttachment,
      });

      await user.click(screen.getByRole("button", { name: "Remove photo" }));

      expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
    });

    it("lets a photo be sent with no caption at all", () => {
      // A photo says enough on its own — the send button must not stay disabled
      // just because the text field is empty.
      renderInput({ attachment: imageAttachment(), onAttachImage: vi.fn() });

      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeEnabled();
    });
  });
});

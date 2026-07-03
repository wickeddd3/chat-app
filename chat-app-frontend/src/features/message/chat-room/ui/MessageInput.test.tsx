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

describe("MessageInput", () => {
  it("renders the labelled input and send button", () => {
    render(<MessageInput channelId="c-1" />);

    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
  });

  it("scopes the send hook to the channel", () => {
    render(<MessageInput channelId="c-1" />);

    expect(useSendMessageMock).toHaveBeenCalledWith({ channelId: "c-1" });
  });

  it("updates the draft as the user types", async () => {
    const user = userEvent.setup();
    render(<MessageInput channelId="c-1" />);

    await user.type(screen.getByLabelText("Message"), "h");

    expect(setMessageMock).toHaveBeenCalledWith("h");
  });

  it("submits the message when the send button is clicked", async () => {
    const user = userEvent.setup();
    render(<MessageInput channelId="c-1" />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(sendMessageMock).toHaveBeenCalled();
  });
});

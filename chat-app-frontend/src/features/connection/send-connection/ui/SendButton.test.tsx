import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendButton } from "./SendButton";

const { sendMock, useSendConnectionMock } = vi.hoisted(() => {
  const sendMock = vi.fn();
  return {
    sendMock,
    useSendConnectionMock: vi.fn(() => ({
      sendConnectionRequest: sendMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useSendConnection", () => ({
  useSendConnection: useSendConnectionMock,
}));

describe("SendButton", () => {
  it("renders the label with an accessible name", () => {
    render(<SendButton text="Add Contact" receiverId="user-9" />);

    expect(
      screen.getByRole("button", { name: "Send connection request" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Contact")).toBeInTheDocument();
  });

  it("scopes the mutation to the authenticated user", () => {
    render(<SendButton text="Add Contact" receiverId="user-9" />);

    expect(useSendConnectionMock).toHaveBeenCalledWith("auth-1");
  });

  it("sends a request to the given receiver on click", async () => {
    const user = userEvent.setup();
    render(<SendButton text="Add Contact" receiverId="user-9" />);

    await user.click(
      screen.getByRole("button", { name: "Send connection request" }),
    );

    expect(sendMock).toHaveBeenCalledWith({ receiverId: "user-9" });
  });
});

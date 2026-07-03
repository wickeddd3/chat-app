import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageButton } from "./MessageButton";

const { navigateToChannelMock, useChatNavigationMock } = vi.hoisted(() => {
  const navigateToChannelMock = vi.fn();
  return {
    navigateToChannelMock,
    useChatNavigationMock: vi.fn(() => ({
      navigateToChannel: navigateToChannelMock,
      isNavigating: false,
      error: null,
    })),
  };
});

vi.mock("../model/useChatNavigation", () => ({
  useChatNavigation: useChatNavigationMock,
}));

describe("MessageButton", () => {
  it("renders the label with an accessible name", () => {
    render(<MessageButton text="Message" targetUserId="user-9" />);

    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("opens the direct channel for the target user on click", async () => {
    const user = userEvent.setup();
    render(<MessageButton text="Message" targetUserId="user-9" />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(navigateToChannelMock).toHaveBeenCalledWith("user-9");
  });
});

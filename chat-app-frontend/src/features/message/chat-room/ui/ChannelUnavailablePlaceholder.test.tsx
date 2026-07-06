import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelUnavailablePlaceholder } from "./ChannelUnavailablePlaceholder";

const navigateMock = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

describe("ChannelUnavailablePlaceholder", () => {
  it("shows the unavailable message", () => {
    render(<ChannelUnavailablePlaceholder />);

    expect(screen.getByText("Channel unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/doesn't exist or you don't have access/i),
    ).toBeInTheDocument();
  });

  it("navigates home when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChannelUnavailablePlaceholder />);

    await user.click(screen.getByRole("button", { name: "Go home" }));

    expect(navigateMock).toHaveBeenCalledWith("/messages");
  });
});

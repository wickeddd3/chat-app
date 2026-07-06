import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckEmailAlert } from "./CheckEmailAlert";

describe("CheckEmailAlert", () => {
  it("tells the user to confirm the email it was sent to", () => {
    render(<CheckEmailAlert email="john@example.com" />);

    expect(screen.getByText(/confirm your email/i)).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<CheckEmailAlert email="john@example.com" onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("omits the close button when no onDismiss is provided", () => {
    render(<CheckEmailAlert email="john@example.com" />);

    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});

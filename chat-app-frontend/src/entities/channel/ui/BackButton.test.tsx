import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackButton } from "./BackButton";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

describe("BackButton", () => {
  it("renders an accessible back control", () => {
    render(<BackButton />);

    expect(
      screen.getByRole("button", { name: "Back to inbox" }),
    ).toBeInTheDocument();
  });

  it("navigates back to the inbox on click", async () => {
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole("button", { name: "Back to inbox" }));

    expect(navigateMock).toHaveBeenCalledWith("/messages");
  });
});

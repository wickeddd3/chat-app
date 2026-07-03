import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcceptButton } from "./AcceptButton";

const { acceptMock, useAcceptConnectionMock } = vi.hoisted(() => {
  const acceptMock = vi.fn();
  return {
    acceptMock,
    useAcceptConnectionMock: vi.fn(() => ({
      acceptConnectionRequest: acceptMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useAcceptConnection", () => ({
  useAcceptConnection: useAcceptConnectionMock,
}));

describe("AcceptButton", () => {
  it("renders the label with an accessible name", () => {
    render(<AcceptButton text="Accept Request" connectionRequestId="req-1" />);

    expect(
      screen.getByRole("button", { name: "Accept connection request" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accept Request")).toBeInTheDocument();
  });

  it("scopes the mutation to the authenticated user", () => {
    render(<AcceptButton text="Accept Request" connectionRequestId="req-1" />);

    expect(useAcceptConnectionMock).toHaveBeenCalledWith("auth-1");
  });

  it("accepts the given request id on click", async () => {
    const user = userEvent.setup();
    render(<AcceptButton text="Accept Request" connectionRequestId="req-1" />);

    await user.click(
      screen.getByRole("button", { name: "Accept connection request" }),
    );

    expect(acceptMock).toHaveBeenCalledWith("req-1");
  });
});

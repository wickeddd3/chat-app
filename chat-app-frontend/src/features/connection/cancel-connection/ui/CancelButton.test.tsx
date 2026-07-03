import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CancelButton } from "./CancelButton";

const { cancelMock, useCancelConnectionMock } = vi.hoisted(() => {
  const cancelMock = vi.fn();
  return {
    cancelMock,
    useCancelConnectionMock: vi.fn(() => ({
      cancelConnectionRequest: cancelMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useCancelConnection", () => ({
  useCancelConnection: useCancelConnectionMock,
}));

describe("CancelButton", () => {
  it("renders the label with an accessible name", () => {
    render(
      <CancelButton
        text="Cancel Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Cancel connection request" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancel Request")).toBeInTheDocument();
  });

  it("scopes the mutation to the authenticated user", () => {
    render(
      <CancelButton
        text="Cancel Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    expect(useCancelConnectionMock).toHaveBeenCalledWith("auth-1");
  });

  it("cancels with the request id and recipient id on click", async () => {
    const user = userEvent.setup();
    render(
      <CancelButton
        text="Cancel Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Cancel connection request" }),
    );

    expect(cancelMock).toHaveBeenCalledWith({
      connectionRequestId: "req-1",
      connectionRequestUserId: "user-1",
    });
  });
});

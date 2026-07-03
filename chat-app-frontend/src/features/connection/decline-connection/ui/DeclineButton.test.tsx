import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeclineButton } from "./DeclineButton";

const { declineMock, useDeclineConnectionMock } = vi.hoisted(() => {
  const declineMock = vi.fn();
  return {
    declineMock,
    useDeclineConnectionMock: vi.fn(() => ({
      declineConnectionRequest: declineMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useDeclineConnection", () => ({
  useDeclineConnection: useDeclineConnectionMock,
}));

describe("DeclineButton", () => {
  it("renders the label with an accessible name", () => {
    render(
      <DeclineButton
        text="Decline Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Decline connection request" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Decline Request")).toBeInTheDocument();
  });

  it("scopes the mutation to the authenticated user", () => {
    render(
      <DeclineButton
        text="Decline Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    expect(useDeclineConnectionMock).toHaveBeenCalledWith("auth-1");
  });

  it("declines with the request id and requester id on click", async () => {
    const user = userEvent.setup();
    render(
      <DeclineButton
        text="Decline Request"
        connectionRequestId="req-1"
        connectionRequestUserId="user-1"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Decline connection request" }),
    );

    expect(declineMock).toHaveBeenCalledWith({
      connectionRequestId: "req-1",
      connectionRequestUserId: "user-1",
    });
  });
});

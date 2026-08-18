import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveGroupButton } from "./LeaveGroupButton";

const { leaveMock, useLeaveGroupChannelMock } = vi.hoisted(() => {
  const leaveMock = vi.fn();
  return {
    leaveMock,
    useLeaveGroupChannelMock: vi.fn(() => ({
      leaveGroupChannel: leaveMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useLeaveGroupChannel", () => ({
  useLeaveGroupChannel: useLeaveGroupChannelMock,
}));

const trigger = () => screen.getByRole("button", { name: "Leave group" });

describe("LeaveGroupButton", () => {
  beforeEach(() => leaveMock.mockClear());

  it("redirects out of the room on success — the channel becomes unreadable", () => {
    render(<LeaveGroupButton channelId="c1" channelName="Team" />);

    expect(useLeaveGroupChannelMock).toHaveBeenCalledWith("auth-1", {
      redirectOnSuccess: true,
    });
  });

  it("asks for confirmation before leaving anything", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" />);

    await user.click(trigger());

    expect(
      screen.getByRole("alertdialog", { name: /Leave Team\?/ }),
    ).toBeInTheDocument();
    expect(leaveMock).not.toHaveBeenCalled();
  });

  it("warns a plain member that they lose access but can be re-added", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" />);

    await user.click(trigger());

    expect(
      screen.getByText(/admin can add you back later/i),
    ).toBeInTheDocument();
  });

  it("warns the sole admin that the role passes on", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" isSoleAdmin />);

    await user.click(trigger());

    expect(
      screen.getByText(/longest-standing remaining member becomes/i),
    ).toBeInTheDocument();
  });

  it("warns the last member that the group is destroyed, and says so on the button", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" isLastMember />);

    await user.click(trigger());

    expect(screen.getByText(/history will be deleted/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete group" }),
    ).toBeInTheDocument();
  });

  it("leaves once confirmed", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" />);

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Leave group" }));

    expect(leaveMock).toHaveBeenCalledWith({
      channelId: "c1",
      channelName: "Team",
    });
  });

  it("backs out without leaving when cancelled", async () => {
    const user = userEvent.setup();
    render(<LeaveGroupButton channelId="c1" channelName="Team" />);

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(leaveMock).not.toHaveBeenCalled();
  });
});

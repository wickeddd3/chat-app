import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoveContactButton } from "./RemoveContactButton";

const { removeMock, useRemoveContactMock } = vi.hoisted(() => {
  const removeMock = vi.fn();
  return {
    removeMock,
    useRemoveContactMock: vi.fn(() => ({
      removeContact: removeMock,
      isPending: false,
      error: null,
    })),
  };
});

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useRemoveContact", () => ({
  useRemoveContact: useRemoveContactMock,
}));

/** The row control; the dialog's confirm button keeps the generic name. */
const trigger = () => screen.getByRole("button", { name: "Remove Jane" });
const confirm = () => screen.getByRole("button", { name: "Remove contact" });

describe("RemoveContactButton", () => {
  beforeEach(() => removeMock.mockClear());

  it("names the contact on the trigger, so rows stay distinguishable", () => {
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    expect(trigger()).toBeInTheDocument();
  });

  it("falls back to a generic label when no name is known", () => {
    render(<RemoveContactButton targetUserId="user-1" />);

    expect(
      screen.getByRole("button", { name: "Remove contact" }),
    ).toBeInTheDocument();
  });

  it("scopes the mutation to the authenticated user", () => {
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    expect(useRemoveContactMock).toHaveBeenCalledWith("auth-1");
  });

  it("asks for confirmation before removing anything", async () => {
    const user = userEvent.setup();
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    await user.click(trigger());

    expect(
      screen.getByRole("alertdialog", { name: /Remove Jane\?/ }),
    ).toBeInTheDocument();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("explains that history is kept and the pair can reconnect", async () => {
    const user = userEvent.setup();
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    await user.click(trigger());

    expect(
      screen.getByText(/no longer be able to message each other/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/conversation\s+history is kept/i),
    ).toBeInTheDocument();
  });

  it("removes the contact once confirmed", async () => {
    const user = userEvent.setup();
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    await user.click(trigger());
    await user.click(confirm());

    expect(removeMock).toHaveBeenCalledWith({
      contactUserId: "user-1",
      contactName: "Jane",
    });
  });

  it("backs out without removing when cancelled", async () => {
    const user = userEvent.setup();
    render(<RemoveContactButton targetUserId="user-1" targetName="Jane" />);

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(removeMock).not.toHaveBeenCalled();
  });
});

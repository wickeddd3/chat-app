import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberListItem } from "./MemberListItem";
import type { ConnectionUser } from "../model/connection.types";

const user: ConnectionUser = {
  id: "user-1",
  name: "Jane Doe",
  username: "janedoe",
  image: null,
};

describe("MemberListItem", () => {
  it("renders the name and @username", () => {
    render(
      <MemberListItem user={user} onToggleMember={vi.fn()} selectedIds={[]} />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("@janedoe")).toBeInTheDocument();
  });

  it("checks the box when the user is already selected", () => {
    render(
      <MemberListItem
        user={user}
        onToggleMember={vi.fn()}
        selectedIds={["user-1"]}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("leaves the box unchecked when the user is not selected", () => {
    render(
      <MemberListItem
        user={user}
        onToggleMember={vi.fn()}
        selectedIds={["other"]}
      />,
    );

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggles the user by id when the row is clicked", async () => {
    const onToggleMember = vi.fn();
    const client = userEvent.setup();
    render(
      <MemberListItem
        user={user}
        onToggleMember={onToggleMember}
        selectedIds={[]}
      />,
    );

    await client.click(screen.getByRole("checkbox"));

    expect(onToggleMember).toHaveBeenCalledWith("user-1");
  });
});

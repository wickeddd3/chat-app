import { render, screen } from "@testing-library/react";
import { UserListItem } from "./UserListItem";

const user = { name: "Jane Doe", username: "janedoe", image: null };

describe("UserListItem", () => {
  it("renders the name and @username", () => {
    render(<UserListItem user={user} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("@janedoe")).toBeInTheDocument();
  });

  it("shows the New badge only when isNew is set", () => {
    const { rerender } = render(<UserListItem user={user} />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();

    rerender(<UserListItem user={user} isNew />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders the date next to the username when provided", () => {
    render(<UserListItem user={user} date="2 hours ago" />);

    expect(screen.getByText("• 2 hours ago")).toBeInTheDocument();
  });

  it("renders the option slot content", () => {
    render(
      <UserListItem
        user={user}
        optionSlot={<button type="button">Message</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Message" }),
    ).toBeInTheDocument();
  });
});

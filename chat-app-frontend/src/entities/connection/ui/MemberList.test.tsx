import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberList } from "./MemberList";
import type { ConnectionUser } from "../model/connection.types";

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data = [],
    itemContent,
    components,
  }: {
    data?: unknown[];
    itemContent: (index: number, item: unknown) => ReactNode;
    components?: { Footer?: ComponentType };
  }) => (
    <div data-testid="virtuoso">
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
      {components?.Footer ? <components.Footer /> : null}
    </div>
  ),
}));

function contact(id: string): ConnectionUser {
  return { id, name: `User ${id}`, username: `user${id}`, image: null };
}

const baseProps = {
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  onToggleMember: vi.fn(),
  selectedIds: [] as string[],
};

describe("MemberList", () => {
  it("renders a selectable row per user", () => {
    render(<MemberList {...baseProps} users={[contact("1"), contact("2")]} />);

    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 2")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("reflects the selected ids as checked rows", () => {
    render(
      <MemberList
        {...baseProps}
        users={[contact("1"), contact("2")]}
        selectedIds={["2"]}
      />,
    );

    const [first, second] = screen.getAllByRole("checkbox");
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
  });

  it("forwards a toggled user's id to onToggleMember", async () => {
    const onToggleMember = vi.fn();
    const user = userEvent.setup();
    render(
      <MemberList
        {...baseProps}
        onToggleMember={onToggleMember}
        users={[contact("1"), contact("2")]}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[1]);

    expect(onToggleMember).toHaveBeenCalledWith("2");
  });

  it("tells the user to add contacts when they have none", () => {
    render(<MemberList {...baseProps} users={[]} />);

    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("shows the search-specific placeholder when a search finds nobody", () => {
    render(<MemberList {...baseProps} users={[]} searchQuery="zzz" />);

    expect(screen.getByText("No contacts found")).toBeInTheDocument();
    expect(screen.getByText(/zzz/)).toBeInTheDocument();
    // The outright-empty copy would wrongly claim they have no contacts.
    expect(screen.queryByText("No contacts yet")).not.toBeInTheDocument();
  });

  it("shows a spinner while the first page is loading", () => {
    render(<MemberList {...baseProps} users={[]} isLoading />);

    expect(screen.getByText("Loading contacts")).toBeInTheDocument();
    expect(screen.queryByText("No contacts yet")).not.toBeInTheDocument();
  });

  it("keeps rendering rows while a further page loads", () => {
    render(<MemberList {...baseProps} users={[contact("1")]} isLoading />);

    expect(screen.getByTestId("virtuoso")).toBeInTheDocument();
  });
});

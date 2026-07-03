import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationResults } from "./NotificationResults";
import type { Notification } from "@/entities/notification";

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

function notification(id: string, overrides: Partial<Notification> = {}): Notification {
  return {
    id,
    type: "CONNECTION_REQUEST",
    title: `Title ${id}`,
    content: `Content ${id}`,
    isRead: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    referenceId: `ref-${id}`,
    ...overrides,
  };
}

const baseProps = {
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  onClick: vi.fn(),
};

describe("NotificationResults", () => {
  it("shows the loading skeleton and no list while loading", () => {
    render(
      <NotificationResults {...baseProps} results={[]} isLoading isEmpty />,
    );

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });

  it("shows the empty placeholder when there are no notifications", () => {
    render(<NotificationResults {...baseProps} results={[]} isEmpty />);

    expect(screen.getByText("No notifications")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("renders a row per notification", () => {
    render(
      <NotificationResults
        {...baseProps}
        results={[notification("1"), notification("2")]}
      />,
    );

    expect(screen.getByText("Title 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("marks the clicked notification as read by its id", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <NotificationResults
        {...baseProps}
        onClick={onClick}
        results={[notification("1"), notification("2")]}
      />,
    );

    await user.click(screen.getByText("Title 2"));

    expect(onClick).toHaveBeenCalledWith(["2"]);
  });
});

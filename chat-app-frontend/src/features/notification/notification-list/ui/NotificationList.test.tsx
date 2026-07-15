import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationList } from "./NotificationList";
import { useNotifications } from "../model/useNotifications";
import type { Notification } from "@/entities/notification";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

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

const mockedHook = vi.mocked(useNotifications);

function notification(id: string, isRead: boolean): Notification {
  return {
    id,
    type: "CONNECTION_REQUEST",
    title: `Title ${id}`,
    content: `Content ${id}`,
    isRead,
    createdAt: "2026-01-01T00:00:00.000Z",
    referenceId: `ref-${id}`,
  };
}

function hookState(
  notifications: Notification[],
  overrides: Partial<ReturnType<typeof useNotifications>> = {},
) {
  return {
    notifications,
    isLoading: false,
    isEmpty: notifications.length === 0,
    total: notifications.length,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useNotifications>;
}

/** Each tab drives its own server-filtered query, so mock per filter. */
function mockFilters(
  all: Notification[],
  unread: Notification[],
  unreadOverrides: Partial<ReturnType<typeof useNotifications>> = {},
) {
  mockedHook.mockImplementation((_authId, filter = "all") =>
    filter === "unread" ? hookState(unread, unreadOverrides) : hookState(all),
  );
}

describe("NotificationList", () => {
  it("shows the server-reported unread total in the Unread tab", () => {
    // The loaded unread page holds 2, but the server says there are 7 in total —
    // the badge must report the total, not the loaded length.
    mockFilters(
      [
        notification("1", false),
        notification("2", false),
        notification("3", true),
      ],
      [notification("1", false), notification("2", false)],
      { total: 7 },
    );

    render(<NotificationList onClick={vi.fn()} />);

    expect(screen.getByRole("tab", { name: /unread/i })).toHaveTextContent("7");
  });

  it("scopes a query per tab to the authenticated user", () => {
    mockFilters([], []);

    render(<NotificationList onClick={vi.fn()} />);

    expect(mockedHook).toHaveBeenCalledWith("auth-1", "all");
    expect(mockedHook).toHaveBeenCalledWith("auth-1", "unread");
  });

  it("forwards a clicked notification's id to onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    mockFilters([notification("1", false), notification("2", false)], []);

    render(<NotificationList onClick={onClick} />);

    await user.click(screen.getByText("Title 2"));

    expect(onClick).toHaveBeenCalledWith(["2"]);
  });
});

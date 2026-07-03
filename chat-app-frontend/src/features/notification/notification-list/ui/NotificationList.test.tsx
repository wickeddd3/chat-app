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
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useNotifications>;
}

describe("NotificationList", () => {
  it("shows the unread count in the Unread tab", () => {
    mockedHook.mockReturnValue(
      hookState([
        notification("1", false),
        notification("2", false),
        notification("3", true),
      ]),
    );

    render(<NotificationList onClick={vi.fn()} />);

    expect(screen.getByRole("tab", { name: /unread/i })).toHaveTextContent("2");
  });

  it("scopes the notifications query to the authenticated user", () => {
    mockedHook.mockReturnValue(hookState([]));

    render(<NotificationList onClick={vi.fn()} />);

    expect(mockedHook).toHaveBeenCalledWith("auth-1");
  });

  it("forwards a clicked notification's id to onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    mockedHook.mockReturnValue(
      hookState([notification("1", false), notification("2", false)]),
    );

    render(<NotificationList onClick={onClick} />);

    await user.click(screen.getByText("Title 2"));

    expect(onClick).toHaveBeenCalledWith(["2"]);
  });
});

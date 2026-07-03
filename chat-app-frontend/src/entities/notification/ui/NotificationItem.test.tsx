import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../model/notification.types";

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n-1",
    type: "CONNECTION_REQUEST",
    title: "New connection request",
    content: "Jane wants to connect",
    isRead: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    referenceId: "ref-1",
    ...overrides,
  };
}

describe("NotificationItem", () => {
  it("renders the title and content", () => {
    render(<NotificationItem notification={notification()} onClick={vi.fn()} />);

    expect(screen.getByText("New connection request")).toBeInTheDocument();
    expect(screen.getByText("Jane wants to connect")).toBeInTheDocument();
  });

  it("calls onClick when activated", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<NotificationItem notification={notification()} onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders an icon for each notification type without crashing", () => {
    const types = [
      "CONNECTION_REQUEST",
      "CONNECTION_ACCEPTED",
      "CHANNEL_INVITE",
    ] as const;

    types.forEach((type) => {
      const { unmount } = render(
        <NotificationItem
          notification={notification({ type, title: `title-${type}` })}
          onClick={vi.fn()}
        />,
      );
      expect(screen.getByText(`title-${type}`)).toBeInTheDocument();
      unmount();
    });
  });
});

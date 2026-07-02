import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleIncomingNotification } from "./notification-new.handler";
import type { Notification } from "@/entities/notification";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { info: vi.fn() },
}));

describe("handleIncomingNotification", () => {
  const queryKeys = createQueryKeys("auth-user");

  const notification: Notification = {
    id: "notif-1",
    type: "CONNECTION_REQUEST",
    title: "New request",
    content: "Someone wants to connect",
    isRead: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    referenceId: "connection-1",
  };

  it("prepends the notification to the latest page", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.notifications.list(), {
      pages: [{ notifications: [] }],
    });

    handleIncomingNotification(queryClient, queryKeys, notification);

    const list = queryClient.getQueryData<{
      pages: { notifications: Notification[] }[];
    }>(queryKeys.notifications.list());
    expect(list?.pages[0]?.notifications).toEqual([notification]);
  });

  it("increments the dashboard unread notification count", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      unreadNotificationsCount: 1,
    });

    handleIncomingNotification(queryClient, queryKeys, notification);

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      unreadNotificationsCount: 2,
    });
  });

  it("shows a toast with the notification title and content", () => {
    const queryClient = new QueryClient();

    handleIncomingNotification(queryClient, queryKeys, notification);

    expect(toast.info).toHaveBeenCalledWith("New request", {
      description: "Someone wants to connect",
    });
  });
});

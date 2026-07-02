import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleCanceledRequest } from "./request-canceled.handler";
import type { Connection } from "@/entities/connection";
import type { Notification } from "@/entities/notification";
import type { User } from "@/entities/user";

describe("handleCanceledRequest", () => {
  const queryKeys = createQueryKeys("auth-user");

  const payload = { senderId: "user-2", connectionId: "connection-1" };

  it("removes the canceled request from the received requests cache", () => {
    const queryClient = new QueryClient();
    const connection = { id: "connection-1" } as Connection;
    queryClient.setQueryData(queryKeys.connections.received(), {
      pages: [{ connections: [connection] }],
    });

    handleCanceledRequest(queryClient, queryKeys, payload);

    const received = queryClient.getQueryData<{
      pages: { connections: Connection[] }[];
    }>(queryKeys.connections.received());
    expect(received?.pages[0]?.connections).toEqual([]);
  });

  it("removes the matching connection-request notification", () => {
    const queryClient = new QueryClient();
    const notification = {
      id: "notif-1",
      referenceId: "connection-1",
    } as Notification;
    const otherNotification = {
      id: "notif-2",
      referenceId: "connection-2",
    } as Notification;
    queryClient.setQueryData(queryKeys.notifications.list(), {
      pages: [{ notifications: [notification, otherNotification] }],
    });

    handleCanceledRequest(queryClient, queryKeys, payload);

    const list = queryClient.getQueryData<{
      pages: { notifications: Notification[] }[];
    }>(queryKeys.notifications.list());
    expect(list?.pages[0]?.notifications).toEqual([otherNotification]);
  });

  it("resets the sender's connectionStatus back to STRANGER", () => {
    const queryClient = new QueryClient();
    const users: User[] = [
      {
        id: "user-2",
        name: "Jane",
        username: "jane",
        connectionStatus: "PENDING_RECEIVED",
        connectionId: "connection-1",
      },
    ];
    queryClient.setQueryData(queryKeys.users.recommended(""), users);

    handleCanceledRequest(queryClient, queryKeys, payload);

    expect(
      queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
    ).toEqual([
      { ...users[0], connectionId: null, connectionStatus: "STRANGER" },
    ]);
  });

  it("decrements pending request and unread notification counts", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      pendingRequestsCount: 2,
      unreadNotificationsCount: 3,
    });

    handleCanceledRequest(queryClient, queryKeys, payload);

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      pendingRequestsCount: 1,
      unreadNotificationsCount: 2,
    });
  });
});

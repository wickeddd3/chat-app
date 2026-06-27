import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import type { Notification } from "@/entities/notification";
import type { User } from "@/entities/user";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Remove connection request to received request cache
export const handleCanceledRequest = (
  queryClient: QueryClient,
  payload: {
    senderId: string;
    connectionId: string;
  },
) => {
  // Remove new connection request from existing received connection requests cache
  queryClient.setQueryData(
    REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
    (old: { pages: { connections: Connection[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        // Map through each paginated page and filter out the canceled request
        pages: old.pages.map((page: { connections: Connection[] }) => ({
          ...page,
          connections: page.connections.filter(
            (req: Connection) => req.id !== payload.connectionId,
          ),
        })),
      };
    },
  );

  // Remove new connection request notification from existing notifications cache
  queryClient.setQueryData(
    REACT_QUERY_KEYS["NOTIFICATIONS"],
    (old: { pages: { notifications: Notification[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { notifications: Notification[] }) => {
          return {
            ...page,
            notifications: page.notifications.filter(
              (notif: Notification) =>
                notif.referenceId !== payload.connectionId,
            ),
          };
        }),
      };
    },
  );

  // Update users list to update user connectionStatus
  queryClient.setQueryData(
    [...REACT_QUERY_KEYS["USERS"], ""],
    (old: User[]) => {
      if (!old) return old;

      const currentUsers = [...old];
      const userIndex = currentUsers.findIndex(
        (user) => user.id === payload.senderId,
      );

      currentUsers[userIndex] = {
        ...currentUsers[userIndex],
        connectionId: null,
        connectionStatus: "STRANGER",
      };

      return currentUsers;
    },
  );

  // Decrement pending request count and unread notifications count
  queryClient.setQueryData(
    REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["pendingRequestsCount"] =
        currentUnreadCountStats["pendingRequestsCount"] - 1;
      currentUnreadCountStats["unreadNotificationsCount"] =
        currentUnreadCountStats["unreadNotificationsCount"] - 1;

      return currentUnreadCountStats;
    },
  );
};

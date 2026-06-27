import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Append new connection request to received request cache
export const handleNewRequest = (
  queryClient: QueryClient,
  connection: Connection,
) => {
  // Append new connection request to existing received connection requests cache
  queryClient.setQueryData(
    REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
    (old: { pages: { connections: Connection[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { connections: Connection[] }, index) => {
          // Prepend only to page index 0 (the initial loaded batch view)
          if (index === 0) {
            return {
              ...page,
              connections: [connection, ...page.connections],
            };
          }
          return page;
        }),
      };
    },
  );

  // Increment pending request count
  queryClient.setQueryData(
    REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["pendingRequestsCount"] =
        currentUnreadCountStats["pendingRequestsCount"] + 1;

      return currentUnreadCountStats;
    },
  );

  // Update users list to update user connectionStatus
  queryClient.setQueryData(
    [...REACT_QUERY_KEYS["USERS"], ""],
    (old: User[]) => {
      if (!old) return old;

      const currentUsers = [...old];
      const userIndex = currentUsers.findIndex(
        (user) => user.id === connection.user.id,
      );

      currentUsers[userIndex] = {
        ...currentUsers[userIndex],
        connectionId: connection.id,
        connectionStatus: "PENDING_RECEIVED",
      };

      return currentUsers;
    },
  );
};

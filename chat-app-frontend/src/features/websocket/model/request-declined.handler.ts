import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

// Remove connection request to received request cache
export const handleDeclinedRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: {
    receiverId: string;
    connectionId: string;
  },
) => {
  // Remove sent connection request from existing sent connection requests cache
  queryClient.setQueryData(
    queryKeys.sentRequests.list(),
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

  // Update users list to update user connectionStatus
  queryClient.setQueryData(queryKeys.users.recommended(""), (old: User[]) => {
    if (!old) return old;

    const currentUsers = [...old];
    const userIndex = currentUsers.findIndex(
      (user) => user.id === payload.receiverId,
    );

    currentUsers[userIndex] = {
      ...currentUsers[userIndex],
      connectionId: null,
      connectionStatus: "STRANGER",
    };

    return currentUsers;
  });
};

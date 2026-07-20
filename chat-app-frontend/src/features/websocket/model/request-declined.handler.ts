import type { QueryClient } from "@tanstack/react-query";
import { removeConnectionRequest } from "@/entities/connection";
import type { User } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface DeclinedRequestPayload {
  receiverId: string;
  connectionId: string;
}

export const handleDeclinedRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: DeclinedRequestPayload,
) => {
  // Remove sent connection request from existing sent connection requests cache
  // (and drop the Sent tab total)
  removeConnectionRequest(
    queryClient,
    queryKeys.connections.sent(),
    payload.connectionId,
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

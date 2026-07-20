import type { QueryClient } from "@tanstack/react-query";
import {
  prependConnectionRequest,
  type Connection,
} from "@/entities/connection";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export type NewRequestPayload = Connection;

export const handleNewRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: NewRequestPayload,
) => {
  const connection = payload;

  // Append new connection request to existing received connection requests cache
  // (and bump the Received tab total)
  prependConnectionRequest(
    queryClient,
    queryKeys.connections.received(),
    connection,
  );

  // Increment pending request count
  queryClient.setQueryData(
    queryKeys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["pendingRequestsCount"] =
        currentUnreadCountStats["pendingRequestsCount"] + 1;

      return currentUnreadCountStats;
    },
  );

  // Update users lists to update user connectionStatus
  patchRecommendedUser(queryClient, queryKeys, connection.user.id, {
    connectionId: connection.id,
    connectionStatus: "PENDING_RECEIVED",
  });
};

import type { QueryClient } from "@tanstack/react-query";
import { removeConnectionRequest } from "@/entities/connection";
import {
  invalidateNotificationFilters,
  removeNotificationsByReference,
} from "@/entities/notification";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface CanceledRequestPayload {
  senderId: string;
  connectionId: string;
}

export const handleCanceledRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: CanceledRequestPayload,
) => {
  // Remove new connection request from existing received connection requests
  // cache (and drop the Received tab total)
  removeConnectionRequest(
    queryClient,
    queryKeys.connections.received(),
    payload.connectionId,
  );

  // Remove new connection request notification from existing notifications cache
  // (and drop its tab total)
  removeNotificationsByReference(
    queryClient,
    queryKeys.notifications.list(),
    payload.connectionId,
  );

  // Update users lists to update user connectionStatus
  patchRecommendedUser(queryClient, queryKeys, payload.senderId, {
    connectionId: null,
    connectionStatus: "STRANGER",
  });

  // Decrement pending request count and unread notifications count
  queryClient.setQueryData(
    queryKeys.dashboard.badges(),
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

  // The request notification was removed above, so it also left the Unread tab's
  // set — refetch that server-filtered list and its badge total.
  invalidateNotificationFilters(queryClient, ["unread"]);
};

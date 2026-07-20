import { removeConnectionRequest } from "@/entities/connection";
import {
  invalidateNotificationFilters,
  removeNotificationsByReference,
} from "@/entities/notification";
import type { User } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TData = string;
export type TError = Error;
export type TVariables = {
  connectionRequestId: string;
  connectionRequestUserId: string;
};
export type TContext = {
  previousRequests: unknown; // Specific shape of cached query data
  client: QueryClient; // Passing the client via custom context
  keys: ScopedQueryKeys;
};

export async function onMutate(
  variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  const connectionRequestId = variables.connectionRequestId;

  // 1. Cancel outbound refetches so they don't overwrite our optimistic state
  await context.client.cancelQueries({
    queryKey: context.keys.connections.received(),
  });

  // 2. Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(
    context.keys.connections.received(),
  );

  // 3. Optimistically drop the declined request from the list and its tab total
  removeConnectionRequest(
    context.client,
    context.keys.connections.received(),
    connectionRequestId,
  );

  // 4. Return the context object containing the rollback snapshot data
  return { previousRequests, client: context.client, keys: context.keys };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  context: TContext | undefined,
) {
  // Rollback to previous state on failure
  if (context?.previousRequests) {
    context.client.setQueryData(
      context.keys.connections.received(),
      context.previousRequests,
    );
  }
  toast.error("Failed to decline request", {
    description: "Error occurred while declining connection request",
  });
}

export function onSuccess(
  _data: TData,
  variables: TVariables,
  context: TContext | undefined,
) {
  toast.success("Connection request declined");

  const connectionRequestId: string = variables.connectionRequestId;
  const connectionRequestUserId: string = variables.connectionRequestUserId;

  // Update users list to update user connectionStatus
  context?.client.setQueryData(
    context.keys.users.recommended(""),
    (old: User[]) => {
      if (!old) return old;

      const currentUsers = [...old];
      const userIndex = currentUsers.findIndex(
        (user) => user.id === connectionRequestUserId,
      );

      currentUsers[userIndex] = {
        ...currentUsers[userIndex],
        connectionStatus: "STRANGER",
        connectionId: null,
      };

      return currentUsers;
    },
  );

  // Remove new connection request notification from existing notifications cache
  // (and drop its tab total)
  if (context) {
    removeNotificationsByReference(
      context.client,
      context.keys.notifications.list(),
      connectionRequestId,
    );
  }

  // Decrement pending request count and unread notifications count
  context?.client.setQueryData(
    context.keys.dashboard.badges(),
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
  if (context?.client) {
    invalidateNotificationFilters(context.client, ["unread"]);
  }
}

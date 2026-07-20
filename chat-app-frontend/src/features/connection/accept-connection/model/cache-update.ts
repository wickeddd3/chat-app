import {
  prependContact,
  removeConnectionRequest,
  type Connection,
  type ConnectionUser,
} from "@/entities/connection";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TData = Connection;
export type TError = Error;
export type TVariables = string; // connectionId is a string
export type TContext = {
  previousRequests: unknown; // Specific shape of cached query data
  client: QueryClient; // Passing the client via custom context
  keys: ScopedQueryKeys;
};

export async function onMutate(
  variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  const connectionId = variables;

  // 1. Cancel outbound refetches so they don't overwrite our optimistic state
  await context.client.cancelQueries({
    queryKey: context.keys.connections.received(),
  });

  // 2. Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(
    context.keys.connections.received(),
  );

  // 3. Optimistically drop the accepted request from the list and its tab total
  removeConnectionRequest(
    context.client,
    context.keys.connections.received(),
    connectionId,
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

  toast.error("Failed to accept request", {
    description: "Error occurred while accepting connection request",
  });
}

export function onSuccess(
  data: TData,
  _variables: TVariables,
  context: TContext | undefined,
) {
  toast.success("Connection request accepted");

  const newContact: ConnectionUser = {
    id: data?.user.id || "",
    name: data?.user.name || "",
    username: data?.user.username || "",
    image: data?.user.image || "",
    updatedAt: data?.updatedAt || "",
  };

  // Update contacts lists (and their tab totals) to include the new contact
  if (context) {
    prependContact(context.client, context.keys, newContact);

    // Update users lists to update user connectionStatus
    patchRecommendedUser(context.client, context.keys, newContact.id, {
      connectionStatus: "CONTACT",
    });
  }

  // Decrement pending request count
  context?.client.setQueryData(
    context.keys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["pendingRequestsCount"] =
        currentUnreadCountStats["pendingRequestsCount"] - 1;

      return currentUnreadCountStats;
    },
  );
}

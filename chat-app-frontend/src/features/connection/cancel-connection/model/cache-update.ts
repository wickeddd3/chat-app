import { removeConnectionRequest } from "@/entities/connection";
import { patchRecommendedUser } from "@/entities/user";
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
    queryKey: context.keys.connections.sent(),
  });

  // 2. Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(
    context.keys.connections.sent(),
  );

  // 3. Optimistically drop the canceled request from the list and its tab total
  removeConnectionRequest(
    context.client,
    context.keys.connections.sent(),
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
      context.keys.connections.sent(),
      context.previousRequests,
    );
  }

  toast.error("Failed to cancel request", {
    description: "Error occurred while canceling connection request",
  });
}

export function onSuccess(
  _data: TData,
  variables: TVariables,
  context: TContext | undefined,
) {
  toast.success("Connection request canceled");

  const connectionRequestUserId: string = variables.connectionRequestUserId;

  // Update users lists to update user connectionStatus
  if (context) {
    patchRecommendedUser(
      context.client,
      context.keys,
      connectionRequestUserId,
      {
        connectionStatus: "STRANGER",
        connectionId: null,
      },
    );
  }
}

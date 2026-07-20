import {
  prependConnectionRequest,
  type Connection,
} from "@/entities/connection";
import type { User } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TData = Connection;
export type TError = Error;
export type TVariables = { receiverId: string };
export type TContext = {
  previousRequests: unknown; // Specific shape of cached query data
  client: QueryClient; // Passing the client via custom context
  keys: ScopedQueryKeys;
};

export async function onMutate(
  _variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  // Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(
    context.keys.connections.sent(),
  );

  // Return the context object containing the rollback snapshot data
  return { previousRequests, client: context.client, keys: context.keys };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  _context: TContext | undefined,
) {
  toast.error("Connection request failed", {
    description: "Error occurred while sending connection request",
  });
}

export function onSuccess(
  data: TData,
  _variables: TVariables,
  context: TContext | undefined,
) {
  toast.success("Connection request sent");

  const newRequest: Connection = data;

  // Update sent requests list (and its tab total) to include the new request
  if (context) {
    prependConnectionRequest(
      context.client,
      context.keys.connections.sent(),
      newRequest,
    );
  }

  // Update users list to update user connectionStatus
  context?.client.setQueryData(
    context.keys.users.recommended(""),
    (old: User[]) => {
      if (!old) return old;

      const currentUsers = [...old];
      const userIndex = currentUsers.findIndex(
        (user) => user.id === newRequest.user.id,
      );

      currentUsers[userIndex] = {
        ...currentUsers[userIndex],
        connectionStatus: "PENDING_SENT",
        connectionId: newRequest.id,
      };

      return currentUsers;
    },
  );
}

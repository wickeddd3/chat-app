import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const sentRequestsQueryKey = REACT_QUERY_KEYS["SENT_CONNECTION_REQUESTS"];
const usersQueryKey = [...REACT_QUERY_KEYS["USERS"], ""];

export type TData = Connection;
export type TError = Error;
export type TVariables = { receiverId: string };
export type TContext = {
  previousRequests: unknown; // Specific shape of cached query data
  client: QueryClient; // Passing the client via custom context
};

export async function onMutate(
  _variables: TVariables,
  context: { client: QueryClient },
): Promise<TContext> {
  // Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(sentRequestsQueryKey);

  // Return the context object containing the rollback snapshot data
  return { previousRequests, client: context.client };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  _context: TContext | undefined,
) {
  toast.error("Connection request failed", {
    description: "Error occurred while sending connection request",
    position: "bottom-right",
  });
}

export function onSuccess(
  data: TData,
  _variables: TVariables,
  context: TContext | undefined,
) {
  toast.success("Connection request sent", {
    position: "bottom-right",
  });

  const newRequest: Connection = data;

  // Update sent requests list to include the new request
  context?.client.setQueryData(
    sentRequestsQueryKey,
    (old: { pages: { connections: Connection[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { connections: Connection[] }, index) => {
          // Prepend only to page index 0 (the initial loaded batch view)
          if (index === 0) {
            return {
              ...page,
              connections: [newRequest, ...page.connections],
            };
          }
          return page;
        }),
      };
    },
  );

  // Update users list to update user connectionStatus
  context?.client.setQueryData(usersQueryKey, (old: User[]) => {
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
  });
}

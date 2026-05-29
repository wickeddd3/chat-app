import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { acceptConnectionRequestApi } from "../api/connections.api";
import type { Connection, ConnectionUser } from "@/entities/connection";
import { toast } from "sonner";
import { optimisticUpdate } from "./optimistic-update";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export function useAcceptConnection(): {
  acceptConnectionRequest: UseMutateFunction<
    Connection,
    Error,
    string,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const queryKey = REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUEST"];
  const contactQueryKey = REACT_QUERY_KEYS["CONTACTS"];

  const { mutate, isPending, error } = useMutation({
    mutationFn: (connectionId: string) =>
      acceptConnectionRequestApi(connectionId),
    onMutate: (connectionId, context) =>
      optimisticUpdate(connectionId, context),
    onError: (err, connectionId, onMutateResult, context) => {
      // Rollback to previous state on failure
      if (onMutateResult?.previousRequests) {
        context.client.setQueryData(queryKey, onMutateResult.previousRequests);
      }
      toast.error("Failed to accept request", {
        description: "Error occurred while accepting connection request",
        position: "bottom-right",
      });
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      // Invalidate to synchronize completely with DB
      context.client.invalidateQueries({ queryKey });
    },
    onSuccess: (data, variables, onMutate, context) => {
      toast.success("Connection request accepted", {
        position: "bottom-right",
      });

      const newContact: ConnectionUser = {
        id: data?.user.id || "",
        name: data?.user.name || "",
        username: data?.user.username || "",
        image: data?.user.image || "",
        updatedAt: data?.updatedAt || "",
      };

      // Update contacts list to include the new connection if it was accepted successfully
      context.client.setQueryData(
        contactQueryKey,
        (old: { pages: { contacts: ConnectionUser[] }[] }) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(
              (page: { contacts: ConnectionUser[] }, index) => {
                // Prepend only to page index 0 (the initial loaded batch view)
                if (index === 0) {
                  return {
                    ...page,
                    contacts: [newContact, ...page.contacts],
                  };
                }
                return page;
              },
            ),
          };
        },
      );
    },
  });

  return {
    acceptConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}

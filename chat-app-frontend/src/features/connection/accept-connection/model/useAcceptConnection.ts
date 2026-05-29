import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { acceptConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";
import { optimisticUpdate } from "./optimistic-update";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export function useAcceptConnection(): {
  acceptConnectionRequest: UseMutateFunction<Channel, Error, string, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const queryKey = REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUEST"];

  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => acceptConnectionRequestApi(id),
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
    onSuccess: () => {
      toast.success("Connection request accepted", {
        position: "bottom-right",
      });
    },
  });

  return {
    acceptConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}

import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { declineConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";
import { optimisticUpdate } from "./optimistic-update";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export function useDeclineConnection(): {
  declineConnectionRequest: UseMutateFunction<Channel, Error, string, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const queryKey = REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"];

  const { mutate, isPending, error } = useMutation({
    mutationFn: (connectionId: string) =>
      declineConnectionRequestApi(connectionId),
    onMutate: (connectionId, context) =>
      optimisticUpdate(connectionId, context),
    onError: (err, connectionId, onMutateResult, context) => {
      // Rollback to previous state on failure
      if (onMutateResult?.previousRequests) {
        context.client.setQueryData(queryKey, onMutateResult.previousRequests);
      }
      toast.error("Failed to decline request", {
        description: "Error occurred while declining connection request",
        position: "bottom-right",
      });
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      // Invalidate to synchronize completely with DB
      context.client.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success("Connection request declined", {
        position: "bottom-right",
      });
    },
  });

  return {
    declineConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}

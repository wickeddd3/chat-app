import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { declineConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";

export function useDeclineConnection(): {
  declineConnectionRequest: UseMutateFunction<Channel, Error, string, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => declineConnectionRequestApi(id),
    onSuccess: () => {
      toast.success("Connection request declined", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Connection request failed", {
        description:
          error?.message || "Error occurred while declining connection request",
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

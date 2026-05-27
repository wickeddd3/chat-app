import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { cancelConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";

export function useCancelConnection(): {
  cancelConnectionRequest: UseMutateFunction<Channel, Error, string, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => cancelConnectionRequestApi(id),
    onSuccess: () => {
      toast.success("Connection request canceled", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Connection request failed", {
        description:
          error?.message || "Error occurred while canceling connection request",
        position: "bottom-right",
      });
    },
  });

  return {
    cancelConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}

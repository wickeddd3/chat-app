import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { acceptConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";

export function useAcceptConnection(): {
  acceptConnectionRequest: UseMutateFunction<Channel, Error, string, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => acceptConnectionRequestApi(id),
    onSuccess: () => {
      toast.success("Connection request accepted", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Connection request failed", {
        description:
          error?.message || "Error occurred while accepting connection request",
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

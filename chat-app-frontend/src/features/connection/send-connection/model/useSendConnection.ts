import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { sendConnectionRequestApi } from "../api/connections.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";

interface SendConnectionRequestData {
  receiverId: string;
}

export function useSendConnection(): {
  sendConnectionRequest: UseMutateFunction<
    Channel,
    Error,
    SendConnectionRequestData,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: SendConnectionRequestData) =>
      sendConnectionRequestApi(formData),
    onSuccess: () => {
      toast.success("Connection request sent", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Connection request failed", {
        description:
          error?.message || "Error occurred while sending connection request",
        position: "bottom-right",
      });
    },
  });

  return {
    sendConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}

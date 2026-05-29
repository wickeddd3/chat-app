import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { sendConnectionRequestApi } from "../api/connections.api";
import type { Connection } from "@/entities/connection";
import { toast } from "sonner";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

interface SendConnectionRequestData {
  receiverId: string;
}

export function useSendConnection(): {
  sendConnectionRequest: UseMutateFunction<
    Connection,
    Error,
    SendConnectionRequestData,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const queryKey = REACT_QUERY_KEYS["SENT_CONNECTION_REQUESTS"];

  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: SendConnectionRequestData) =>
      sendConnectionRequestApi(formData),
    onSuccess: (data, variables, onMutate, context) => {
      toast.success("Connection request sent", {
        position: "bottom-right",
      });

      const newRequest: Connection = {
        ...data,
      };

      // Update sent requests list to include the new request
      context.client.setQueryData(
        queryKey,
        (old: { pages: { connections: Connection[] }[] }) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(
              (page: { connections: Connection[] }, index) => {
                // Prepend only to page index 0 (the initial loaded batch view)
                if (index === 0) {
                  return {
                    ...page,
                    connections: [newRequest, ...page.connections],
                  };
                }
                return page;
              },
            ),
          };
        },
      );
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

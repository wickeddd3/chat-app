import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

export function usePresenceCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStatusChange = (data: {
      userId: string;
      status: "online" | "offline";
    }) => {
      queryClient.setQueryData(
        ["presence", "matrix"],
        (oldMap: Record<string, string> | undefined) => {
          return {
            ...oldMap,
            [data.userId]: data.status,
          };
        },
      );
    };

    webSocketClient.on("user_status_change", handleStatusChange);

    return () => {
      webSocketClient.off("user_status_change", handleStatusChange);
    };
  }, [queryClient]);
}

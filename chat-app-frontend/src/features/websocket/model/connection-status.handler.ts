import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";

// Presence updates handler
export const handleStatusChange = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  data: {
    userId: string;
    status: "online" | "offline";
  },
) => {
  queryClient.setQueryData(
    queryKeys.presence.matrix(),
    (oldMap: Record<string, string> | undefined) => {
      return { ...oldMap, [data.userId]: data.status };
    },
  );
};

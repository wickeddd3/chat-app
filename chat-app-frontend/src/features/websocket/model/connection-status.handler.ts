import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";

export interface StatusPayload {
  userId: string;
  status: "online" | "offline";
}

export const handleStatusChange = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: StatusPayload,
) => {
  // Update user presence status
  queryClient.setQueryData(
    queryKeys.presence.matrix(),
    (oldMap: Record<string, string> | undefined) => {
      return { ...oldMap, [payload.userId]: payload.status };
    },
  );
};

import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { PresenceEntry } from "@/entities/auth";
import type { QueryClient } from "@tanstack/react-query";

export interface StatusPayload {
  userId: string;
  status: "online" | "offline";
  // ISO timestamp on an offline delta; null on an online delta.
  lastSeen: string | null;
}

export const handleStatusChange = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: StatusPayload,
) => {
  // Update user presence status
  queryClient.setQueryData(
    queryKeys.presence.matrix(),
    (oldMap: Record<string, PresenceEntry> | undefined) => {
      return {
        ...oldMap,
        [payload.userId]: {
          status: payload.status,
          lastSeen: payload.lastSeen,
        },
      };
    },
  );
};

import { useQuery } from "@tanstack/react-query";
import { getPresenceMapApi } from "../api/presence.api";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function usePresenceMap(
  authId?: string,
  channelId?: string,
): {
  presenceMap: Record<string, "online" | "offline">;
} {
  const keys = createQueryKeys(authId);

  // Fetch presence context dictionary
  const { data: presenceMap = {} } = useQuery<
    Record<string, "online" | "offline">
  >({
    queryKey: keys.presence.matrix(channelId),
    queryFn: () =>
      getPresenceMapApi({
        params: {
          channelId: channelId || null,
        },
      }),
    staleTime: 60000, // Kept stable for a minute to reduce network spam
    enabled: !!authId,
  });

  return { presenceMap };
}

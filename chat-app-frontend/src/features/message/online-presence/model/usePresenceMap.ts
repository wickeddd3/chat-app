import { useQuery } from "@tanstack/react-query";
import { getPresenceMapApi } from "../api/presence.api";

export function usePresenceMap(
  isAuthenticated: boolean,
  channelId?: string,
): {
  presenceMap: Record<string, "online" | "offline">;
} {
  // Fetch presence context dictionary
  const { data: presenceMap = {} } = useQuery<
    Record<string, "online" | "offline">
  >({
    queryKey: ["presence", "matrix", channelId ?? "global"],
    queryFn: () =>
      getPresenceMapApi({
        params: {
          channelId: channelId || null,
        },
      }),
    staleTime: 60000, // Kept stable for a minute to reduce network spam
    enabled: isAuthenticated,
  });

  return { presenceMap };
}

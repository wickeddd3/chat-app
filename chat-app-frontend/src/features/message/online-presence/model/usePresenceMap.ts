import { useQuery } from "@tanstack/react-query";
import { getPresenceMapApi } from "../api/presence.api";

export function usePresenceMap(isAuthenticated: boolean): {
  presenceMap: Record<string, "online" | "offline">;
} {
  // Fetch presence context dictionary
  const { data: presenceMap = {} } = useQuery({
    queryKey: ["presence", "matrix"],
    queryFn: getPresenceMapApi,
    staleTime: 60000, // Kept stable for a minute to reduce network spam
    enabled: isAuthenticated,
  });

  return { presenceMap };
}

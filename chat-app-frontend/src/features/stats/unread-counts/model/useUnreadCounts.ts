import { useQuery } from "@tanstack/react-query";
import { getUnreadCountsApi } from "../api/stats.api";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useUnreadCounts(authId?: string): {
  unreadCounts: Record<string, number>;
} {
  const keys = createQueryKeys(authId);

  const { data: unreadCounts = {} } = useQuery<Record<string, number>>({
    queryKey: keys.dashboard.badges(),
    queryFn: getUnreadCountsApi,
    staleTime: 60000,
  });

  return { unreadCounts };
}

import { useQuery } from "@tanstack/react-query";
import { getUnreadCountsApi } from "../api/stats.api";

export function useUnreadCounts(): {
  unreadCounts: Record<string, number>;
} {
  const { data: unreadCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["stats", "unread-counts"],
    queryFn: getUnreadCountsApi,
    staleTime: 60000,
  });

  return { unreadCounts };
}

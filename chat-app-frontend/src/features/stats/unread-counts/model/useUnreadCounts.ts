import { useQuery } from "@tanstack/react-query";
import { getUnreadCountsApi } from "../api/stats.api";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export function useUnreadCounts(): {
  unreadCounts: Record<string, number>;
} {
  const { data: unreadCounts = {} } = useQuery<Record<string, number>>({
    queryKey: REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
    queryFn: getUnreadCountsApi,
    staleTime: 60000,
  });

  return { unreadCounts };
}

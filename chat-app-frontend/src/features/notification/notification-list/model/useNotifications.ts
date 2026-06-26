import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotificationsApi } from "../api/notifications.api";
import type {
  PaginatedNotifications,
  Notification,
} from "@/entities/notification";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export function useNotifications() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedNotifications, Error, Notification[]>({
    queryKey: REACT_QUERY_KEYS["NOTIFICATIONS"],
    queryFn: ({ pageParam }) =>
      getNotificationsApi({
        params: {
          cursor: pageParam as string | number | null,
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.notifications),
  });

  const notifications = data ?? [];

  return {
    notifications,
    isLoading,
    isEmpty: !isLoading && notifications.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotificationsApi } from "../api/notifications.api";
import type {
  PaginatedNotifications,
  Notification,
} from "@/entities/notification";

export function useNotifications() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedNotifications, Error, Notification[]>({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) =>
      getNotificationsApi({
        params: { cursor: pageParam },
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

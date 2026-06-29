import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotificationsApi } from "../api/notifications.api";
import type {
  PaginatedNotifications,
  Notification,
} from "@/entities/notification";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useNotifications(authId?: string) {
  const keys = createQueryKeys(authId);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedNotifications, Error, Notification[]>({
    queryKey: keys.notifications.list(),
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

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getNotificationsApi } from "../api/notifications.api";
import type { PaginatedNotifications } from "@/entities/notification";
import {
  createQueryKeys,
  type NotificationFilter,
} from "@/shared/config/react-query-keys";

export function useNotifications(
  authId?: string,
  filter: NotificationFilter = "all",
) {
  const keys = createQueryKeys(authId);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedNotifications, Error>({
    queryKey: keys.notifications.list(filter),
    queryFn: ({ pageParam }) =>
      getNotificationsApi({
        params: {
          cursor: pageParam as string | number | null,
          ...(filter !== "all" && { filter }),
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  );

  // Every page reports the same filter-wide total; read it off the first page.
  const total = data?.pages[0]?.total ?? 0;

  return {
    notifications,
    isLoading,
    isEmpty: !isLoading && notifications.length === 0,
    total,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

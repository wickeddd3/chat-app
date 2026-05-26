import { useInfiniteQuery } from "@tanstack/react-query";
import { sentConnectionRequestsApi } from "../api/connections.api";
import type { Connection, PaginatedConnections } from "@/entities/connection";

export function useSentConnectionRequests(): {
  sentRequests: Connection[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedConnections, unknown, Connection[]>({
    queryKey: ["sent-connection-request"],
    queryFn: ({ pageParam }) =>
      sentConnectionRequestsApi({
        params: {
          cursor: pageParam,
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.connections),
  });

  const sentRequests = data ?? [];

  return {
    sentRequests,
    isLoading,
    isEmpty: !isLoading && sentRequests.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

import { useInfiniteQuery } from "@tanstack/react-query";
import { receivedConnectionRequestsApi } from "../api/connections.api";
import type { Connection, PaginatedConnections } from "@/entities/connection";

export function useReceivedConnectionRequests(): {
  receivedRequests: Connection[];
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
    queryKey: ["received-connection-request"],
    queryFn: ({ pageParam }) =>
      receivedConnectionRequestsApi({
        params: {
          cursor: pageParam,
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.connections),
  });

  const receivedRequests = data ?? [];

  return {
    receivedRequests,
    isLoading,
    isEmpty: !isLoading && receivedRequests.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

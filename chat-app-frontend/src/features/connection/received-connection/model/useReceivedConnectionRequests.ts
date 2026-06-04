import { useInfiniteQuery } from "@tanstack/react-query";
import { receivedConnectionRequestsApi } from "../api/connections.api";
import type { Connection, PaginatedConnections } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

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
    queryKey: REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
    queryFn: ({ pageParam }) =>
      receivedConnectionRequestsApi({
        params: {
          cursor: pageParam as string | number | null,
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

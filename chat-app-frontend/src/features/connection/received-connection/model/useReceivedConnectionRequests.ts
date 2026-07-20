import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { receivedConnectionRequestsApi } from "../api/connections.api";
import type { Connection, PaginatedConnections } from "@/entities/connection";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useReceivedConnectionRequests(authId?: string): {
  receivedRequests: Connection[];
  isLoading: boolean;
  isEmpty: boolean;
  total: number;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const keys = createQueryKeys(authId);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedConnections>({
    queryKey: keys.connections.received(),
    queryFn: ({ pageParam }) =>
      receivedConnectionRequestsApi({
        params: {
          cursor: pageParam as string | number | null,
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const receivedRequests = useMemo(
    () => data?.pages.flatMap((page) => page.connections) ?? [],
    [data],
  );

  // Every page reports the same total; read it off the first page.
  const total = data?.pages[0]?.total ?? 0;

  return {
    receivedRequests,
    isLoading,
    isEmpty: !isLoading && receivedRequests.length === 0,
    total,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

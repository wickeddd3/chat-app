import { useInfiniteQuery } from "@tanstack/react-query";
import { getInboxApi } from "../api/channels.api";
import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";
import {
  createQueryKeys,
  type InboxFilter,
} from "@/shared/config/react-query-keys";

export function useInbox(
  authId?: string,
  query?: string,
  filter: InboxFilter = "all",
): {
  inbox: InboxChannel[];
  appliedQuery: string;
  isLoading: boolean;
  isEmpty: boolean;
  total: number;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const keys = createQueryKeys(authId);

  const [debouncedQuery, setDebouncedQuery] = useState(query ?? "");

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 500),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query ?? "");
  }, [query, debouncedSetQuery]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedInboxChannel>({
    queryKey: keys.inbox.list(debouncedQuery, filter),
    queryFn: ({ pageParam }) =>
      getInboxApi({
        params: {
          cursor: pageParam as string | number | null,
          ...(debouncedQuery && { query: debouncedQuery }),
          ...(filter !== "all" && { filter }),
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const inbox = useMemo(
    () => data?.pages.flatMap((page) => page.channels) ?? [],
    [data],
  );

  // Every page reports the same filter-wide total; read it off the first page.
  const total = data?.pages[0]?.total ?? 0;

  return {
    inbox,
    appliedQuery: debouncedQuery,
    isLoading,
    isEmpty: !isLoading && inbox.length === 0,
    total,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

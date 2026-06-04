import { useInfiniteQuery } from "@tanstack/react-query";
import { getInboxApi } from "../api/channels.api";
import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";

export function useInbox(query: string): {
  inbox: InboxChannel[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 500),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedInboxChannel, unknown, InboxChannel[]>({
    queryKey: ["inbox", debouncedQuery],
    queryFn: ({ pageParam }) =>
      getInboxApi({
        params: {
          cursor: pageParam as string | number | null,
          ...(debouncedQuery && { query: debouncedQuery }),
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.channels),
  });

  const inbox = data ?? [];

  return {
    inbox,
    isLoading,
    isEmpty: !isLoading && inbox.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

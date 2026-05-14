import { useInfiniteQuery } from "@tanstack/react-query";
import { getInbox } from "../api/channels.api";
import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";

export function useInbox(): {
  inbox: InboxChannel[];
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
  } = useInfiniteQuery<PaginatedInboxChannel, unknown, InboxChannel[]>({
    queryKey: ["inbox"],
    queryFn: ({ pageParam }) => getInbox(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.channels),
  });

  return {
    inbox: data ?? [],
    isLoading,
    isEmpty: !isLoading && !!!(data && data?.length),
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

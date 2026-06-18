import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessagesApi } from "../api/messages.api";
import type { Message, PaginatedMessage } from "@/entities/message";

export function useMessages(channelId: string): {
  messages: Message[];
  isLoading: boolean;
  isEmpty: boolean;
  error: Error | null;
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
  } = useInfiniteQuery<PaginatedMessage, Error, Message[]>({
    queryKey: ["messages", channelId],
    queryFn: ({ pageParam }) =>
      getMessagesApi({
        channelId,
        params: {
          cursor: pageParam as string | number | null,
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => {
      return [...data.pages].reverse().flatMap((page) => page.messages);
    },
    enabled: !!channelId,
  });

  const messages = data ?? [];

  return {
    messages,
    isLoading,
    isEmpty: !isLoading && messages.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

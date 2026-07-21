import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/entities/message";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface ReadReceiptPayload {
  channelId: string;
  /** Messages of the recipient's that were just read. */
  messageIds: string[];
  readerId: string;
}

interface TimelineCache {
  pages: { messages: Message[] }[];
}

/**
 * Marks the reader's own messages as read once a recipient opens the channel,
 * so the delivery tick updates without a refetch.
 */
export const handleReadReceipt = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: ReadReceiptPayload,
) => {
  const { channelId, messageIds } = payload;

  if (messageIds.length === 0) return;

  const readIds = new Set(messageIds);

  queryClient.setQueryData(
    queryKeys.messages.timeline(channelId),
    (oldData: TimelineCache | undefined) => {
      if (!oldData) return oldData;

      let changed = false;

      const pages = oldData.pages.map((page) => {
        if (!page.messages.some((message) => readIds.has(message.id))) {
          return page;
        }

        changed = true;

        return {
          ...page,
          messages: page.messages.map((message) =>
            readIds.has(message.id)
              ? // The exact tally isn't known here — only that at least one
                // recipient has now read it, which is what the tick reflects.
                { ...message, readCount: Math.max(message.readCount ?? 0, 1) }
              : message,
          ),
        };
      });

      // Returning the original object when nothing matched keeps the cache
      // reference stable, so the timeline doesn't re-render for a receipt
      // about messages it isn't holding.
      return changed ? { ...oldData, pages } : oldData;
    },
  );
};

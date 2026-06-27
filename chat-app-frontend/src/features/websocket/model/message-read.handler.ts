import type { QueryClient } from "@tanstack/react-query";
import type { InboxChannel } from "@/entities/channel";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Clear unread messages
export const handleClearUnread = (
  queryClient: QueryClient,
  payload: {
    channelId: string;
    readMessageCount: number;
  },
) => {
  queryClient.setQueryData(
    ["inbox", ""],
    (oldData: { pages: { channels: InboxChannel[] }[] }) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      const pageIndex = updatedPages.findIndex(
        (page: { channels: InboxChannel[] }) =>
          page.channels.some(
            (channel: InboxChannel) => String(channel.id) === payload.channelId,
          ),
      );

      if (pageIndex !== -1) {
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          channels: updatedPages[pageIndex].channels.map(
            (channel: InboxChannel) =>
              String(channel.id) === payload.channelId
                ? {
                    ...channel,
                    unreadCount: 0,
                  }
                : channel,
          ),
        };
      }

      return { ...oldData, pages: updatedPages };
    },
  );

  // Decrement unread message count
  queryClient.setQueryData(
    REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["unreadMessagesCount"] =
        currentUnreadCountStats["unreadMessagesCount"] -
        payload.readMessageCount;

      return currentUnreadCountStats;
    },
  );
};

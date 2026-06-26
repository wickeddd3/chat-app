import type { QueryClient } from "@tanstack/react-query";
import type { InboxChannel } from "@/entities/channel";

// Clear unread messages
export const handleClearUnread = (
  queryClient: QueryClient,
  channelId: string,
) => {
  queryClient.setQueryData(
    ["inbox", ""],
    (oldData: { pages: { channels: InboxChannel[] }[] }) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      const pageIndex = updatedPages.findIndex(
        (page: { channels: InboxChannel[] }) =>
          page.channels.some(
            (channel: InboxChannel) => String(channel.id) === channelId,
          ),
      );

      if (pageIndex !== -1) {
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          channels: updatedPages[pageIndex].channels.map(
            (channel: InboxChannel) =>
              String(channel.id) === channelId
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
};

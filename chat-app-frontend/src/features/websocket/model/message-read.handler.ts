import type { QueryClient } from "@tanstack/react-query";
import { invalidateInboxFilters, type InboxChannel } from "@/entities/channel";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface UnreadMessagePayload {
  channelId: string;
  readMessageCount: number;
}

export const handleClearUnread = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: UnreadMessagePayload,
) => {
  // Clear unread message count from inbox
  queryClient.setQueryData(
    queryKeys.inbox.list(""),
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
    queryKeys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["unreadMessagesCount"] =
        currentUnreadCountStats["unreadMessagesCount"] -
        payload.readMessageCount;

      return currentUnreadCountStats;
    },
  );

  // The channel just left the Unread tab's set — refetch that server-filtered
  // list and its badge total so the tab and count reconcile with the server.
  invalidateInboxFilters(queryClient, ["unread"]);
};

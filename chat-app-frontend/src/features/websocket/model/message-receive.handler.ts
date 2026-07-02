import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface IncomingMessagePayload {
  channelPayload: {
    channelId: string;
    lastMessage: {
      content: string;
      createdAt: string;
    };
  };
  messagePayload: Message;
}

export const handleIncomingMessage = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: IncomingMessagePayload,
) => {
  const { channelPayload, messagePayload } = payload;

  // Inbox cache update
  queryClient.setQueryData(
    queryKeys.inbox.list(""),
    (oldData: { pages: { channels: InboxChannel[] }[] }) => {
      if (!oldData) {
        // Fetch fresh inbox list if inbox cache doesn't exist
        queryClient.invalidateQueries({ queryKey: queryKeys.inbox.list("") });
        return oldData;
      }

      const updatedPages = [...oldData.pages];

      // Find channel page index from existing inbox cache
      const pageIndex = updatedPages.findIndex(
        (page: { channels: InboxChannel[] }) =>
          page.channels.some(
            (channel: InboxChannel) =>
              String(channel.id) === channelPayload.channelId,
          ),
      );

      if (pageIndex !== -1) {
        // Increase unreadCount and set lastMessage if channel exist
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          channels: updatedPages[pageIndex].channels.map(
            (channel: InboxChannel) =>
              String(channel.id) === channelPayload.channelId
                ? {
                    ...channel,
                    lastMessage: channelPayload.lastMessage,
                    unreadCount:
                      channel?.unreadCount !== undefined
                        ? channel.unreadCount + 1
                        : channel?.unreadCount,
                  }
                : channel,
          ),
        };
      } else {
        // Fetch fresh inbox list if channel doesn't exist
        queryClient.invalidateQueries({ queryKey: queryKeys.inbox.list("") });
      }

      return { ...oldData, pages: updatedPages };
    },
  );

  // Channel messages cache update
  queryClient.setQueryData(
    queryKeys.messages.timeline(String(channelPayload.channelId)),
    (oldData: { pages: { messages: Message[] }[] }) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      // Find message page index from existing channel message cache
      const pageIndex = updatedPages.findIndex(
        (page: { messages: Message[] }) =>
          page.messages.some(
            (m: Message) => m.clientId === messagePayload.clientId,
          ),
      );

      if (pageIndex !== -1) {
        // Set isSending to false if channel message exist
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          messages: updatedPages[pageIndex].messages.map((m: Message) =>
            m.clientId === messagePayload.clientId
              ? { ...messagePayload, isSending: false }
              : m,
          ),
        };
      } else {
        // Otherwise append straight to page 0 (latest message batch)
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            messages: [...updatedPages[0].messages, messagePayload],
          };
        }
      }

      return { ...oldData, pages: updatedPages };
    },
  );

  // Increment unread message count
  queryClient.setQueryData(
    queryKeys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["unreadMessagesCount"] =
        currentUnreadCountStats["unreadMessagesCount"] + 1;

      return currentUnreadCountStats;
    },
  );
};

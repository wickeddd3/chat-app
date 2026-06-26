import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";

// Inbox badge/list invalidation handler and Global Message listener
export const handleIncomingMessage = (
  queryClient: QueryClient,
  payload: {
    channelPayload: {
      channelId: string;
      lastMessage: {
        content: string;
        createdAt: string;
      };
    };
    messagePayload: Message;
  },
) => {
  const { channelPayload, messagePayload } = payload;

  // Inbox cache update
  queryClient.setQueryData(
    ["inbox", ""],
    (oldData: { pages: { channels: InboxChannel[] }[] }) => {
      if (!oldData) {
        // Fetch fresh inbox list if inbox cache doesn't exist
        queryClient.invalidateQueries({ queryKey: ["inbox", ""] });
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
        queryClient.invalidateQueries({ queryKey: ["inbox", ""] });
      }

      return { ...oldData, pages: updatedPages };
    },
  );

  // Channel messages cache update
  queryClient.setQueryData(
    ["messages", String(channelPayload.channelId)],
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
};

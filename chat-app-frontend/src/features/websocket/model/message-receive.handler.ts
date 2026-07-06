import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { getActiveChannel } from "@/shared/utils/active-channel";

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
  authId?: string,
) => {
  const { channelPayload, messagePayload } = payload;

  // Your own echoed message is never unread — the server excludes self-authored
  // messages from the unread count — so counting it locally is pure drift.
  const isOwnMessage = !!authId && messagePayload.author?.id === authId;

  // A message in the channel you're currently viewing is marked read immediately
  // (below) rather than left to accumulate as unread.
  const isViewingChannel = getActiveChannel() === channelPayload.channelId;

  // Count toward unread only when another user's message lands in a channel you
  // aren't viewing. For the active channel we still bump it here and let the
  // mark-as-read round-trip clear it back to zero, so the optimistic count stays
  // consistent with the server (which does the same +1 then -1).
  const countsAsUnread = !isOwnMessage;

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
        // Always refresh the preview; bump unread only when it counts.
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          channels: updatedPages[pageIndex].channels.map(
            (channel: InboxChannel) =>
              String(channel.id) === channelPayload.channelId
                ? {
                    ...channel,
                    lastMessage: channelPayload.lastMessage,
                    unreadCount:
                      countsAsUnread && channel?.unreadCount !== undefined
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

  // Increment unread message count (skip own messages, which are never unread)
  if (countsAsUnread) {
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
  }

  // Auto-read: a message that arrives while you're viewing its channel is marked
  // read on the server right away, so it never lingers as unread on reload. The
  // resulting message:read broadcast clears the optimistic bump above.
  if (isViewingChannel && !isOwnMessage) {
    webSocketClient.emit("message:mark_as_read", {
      channelId: channelPayload.channelId,
    });
  }
};

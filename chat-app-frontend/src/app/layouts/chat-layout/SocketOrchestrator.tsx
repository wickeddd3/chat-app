import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { toast } from "sonner";
import type { Message } from "@/entities/message";
import type { Notification } from "@/entities/notification";
import type { InboxChannel } from "@/entities/channel";
import type { Connection } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

interface SocketOrchestratorProps {
  isAuthenticated: boolean;
}

export function SocketOrchestrator({
  isAuthenticated,
}: SocketOrchestratorProps) {
  const queryClient = useQueryClient();

  // 1. GLOBAL CORE CONNECTION LIFECYCLE
  useEffect(() => {
    if (!isAuthenticated) {
      if (webSocketClient.connected) webSocketClient.disconnect();
      return;
    }

    webSocketClient.connect();

    return () => {
      webSocketClient.disconnect();
    };
  }, [isAuthenticated]);

  // 2. GLOBAL HEARTBEAT LEASE TICK
  useEffect(() => {
    if (!isAuthenticated) return;

    webSocketClient.emit("heartbeat");

    const interval = setInterval(() => {
      if (webSocketClient.connected) {
        webSocketClient.emit("heartbeat");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 3. GLOBAL BACKGROUND EVENTS (Matrix Sync, Notifications, Inbox Badges, Message Sync)
  useEffect(() => {
    if (!isAuthenticated) return;

    // A. Presence updates handler
    const handleStatusChange = (data: {
      userId: string;
      status: "online" | "offline";
    }) => {
      queryClient.setQueryData(
        ["presence", "matrix", "global"],
        (oldMap: Record<string, string> | undefined) => {
          return { ...oldMap, [data.userId]: data.status };
        },
      );
    };

    // B. Inbox badge/list invalidation handler and Global Message listener
    const handleIncomingMessage = (payload: {
      channelPayload: {
        channelId: string;
        lastMessage: {
          content: string;
          createdAt: string;
        };
      };
      messagePayload: Message;
    }) => {
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

    // C. Real-time notifications interceptor
    const handleIncomingNotification = (notification: Notification) => {
      // Append new notification to exisitng notification cache
      queryClient.setQueryData(
        ["notifications"],
        (oldData: { pages: { notifications: Notification[] }[] }) => {
          if (!oldData) return oldData;

          const updatedPages = [...oldData.pages];

          if (updatedPages[0]) {
            updatedPages[0] = {
              ...updatedPages[0],
              notifications: [notification, ...updatedPages[0].notifications],
            };
          }

          return { ...oldData, pages: updatedPages };
        },
      );

      // Increment unread notification count
      queryClient.setQueryData(
        REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
        (old: Record<string, number>) => {
          if (!old) return old;

          const currentUnreadCountStats = { ...old };
          currentUnreadCountStats["unreadNotificationsCount"] =
            currentUnreadCountStats["unreadNotificationsCount"] + 1;

          return currentUnreadCountStats;
        },
      );

      toast.info(notification.title, { description: notification.content });
    };

    // D. Clear unread messages
    const handleClearUnread = (channelId: string) => {
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

    // E. Append new connection request to received request cache
    const handleNewRequest = (connection: Connection) => {
      queryClient.setQueryData(
        REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
        (old: { pages: { connections: Connection[] }[] }) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map(
              (page: { connections: Connection[] }, index) => {
                // Prepend only to page index 0 (the initial loaded batch view)
                if (index === 0) {
                  return {
                    ...page,
                    connections: [connection, ...page.connections],
                  };
                }
                return page;
              },
            ),
          };
        },
      );
    };

    // Mount Listeners securely
    webSocketClient.on("user_status_change", handleStatusChange);
    webSocketClient.on("new_notification", handleIncomingNotification);
    webSocketClient.on("receive_message", handleIncomingMessage);
    webSocketClient.on("unread_cleared", handleClearUnread);
    webSocketClient.on("new_request", handleNewRequest);

    // Explicit function reference tear-down to avoid silent memory leaks
    return () => {
      webSocketClient.off("user_status_change", handleStatusChange);
      webSocketClient.off("new_notification", handleIncomingNotification);
      webSocketClient.off("receive_message", handleIncomingMessage);
      webSocketClient.off("unread_cleared", handleClearUnread);
      webSocketClient.off("new_request", handleNewRequest);
    };
  }, [isAuthenticated, queryClient]);

  return null; // Headless provider, renders nothing directly
}

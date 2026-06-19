import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { toast } from "sonner";
import type { Message } from "@/entities/message";
import type { Notification } from "@/entities/notification";

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
        ["presence", "matrix"],
        (oldMap: Record<string, string> | undefined) => {
          return { ...oldMap, [data.userId]: data.status };
        },
      );
    };

    // B. Inbox badge/list invalidation handler
    const handleAmbientInboxUpdate = (payload: {
      channelId: string;
      latestMessageSnippet: string;
    }) => {
      // 1. Instantly invalidate the sidebar list query so it re-fetches latest previews
      queryClient.invalidateQueries({ queryKey: ["inbox"] });

      // 2. SELF-HEALING CACHE PATCHING:
      // If TanStack already has a message cache active for this specific channel,
      // we can append a placeholder or invalidate it so it seamlessly updates
      // behind the scenes without requiring a page refresh.
      const isChannelCacheActive = queryClient
        .getQueryCache()
        .find({ queryKey: ["messages", payload.channelId] });

      if (isChannelCacheActive) {
        // Invalidate tells TanStack to quietly pull fresh data from the server in the background
        queryClient.invalidateQueries({
          queryKey: ["messages", payload.channelId],
        });
      }
    };

    // C. Real-time notifications interceptor
    const handleIncomingNotification = (notification: Notification) => {
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
      toast.info(notification.title, { description: notification.content });
    };

    // D. Global Message listener (Ensures you process messages even when looking at other channels)
    const handleIncomingMessage = (newMessage: Message) => {
      queryClient.setQueryData(
        ["messages", String(newMessage.channelId)],
        (oldData: { pages: { messages: Message[] }[] }) => {
          if (!oldData) return oldData;
          const updatedPages = [...oldData.pages];

          // Look for an optimistic version to replace across pages
          const pageIndex = updatedPages.findIndex(
            (page: { messages: Message[] }) =>
              page.messages.some(
                (m: Message) => m.clientId === newMessage.clientId,
              ),
          );

          if (pageIndex !== -1) {
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              messages: updatedPages[pageIndex].messages.map((m: Message) =>
                m.clientId === newMessage.clientId
                  ? { ...newMessage, isSending: false }
                  : m,
              ),
            };
          } else {
            // Otherwise append straight to page 0
            if (updatedPages[0]) {
              updatedPages[0] = {
                ...updatedPages[0],
                messages: [...updatedPages[0].messages, newMessage],
              };
            }
          }
          return { ...oldData, pages: updatedPages };
        },
      );
    };

    // Mount Listeners securely
    webSocketClient.on("user_status_change", handleStatusChange);
    webSocketClient.on("inbox_updated", handleAmbientInboxUpdate);
    webSocketClient.on("new_notification", handleIncomingNotification);
    webSocketClient.on("receive_message", handleIncomingMessage);

    // Explicit function reference tear-down to avoid silent memory leaks
    return () => {
      webSocketClient.off("user_status_change", handleStatusChange);
      webSocketClient.off("inbox_updated", handleAmbientInboxUpdate);
      webSocketClient.off("new_notification", handleIncomingNotification);
      webSocketClient.off("receive_message", handleIncomingMessage);
    };
  }, [isAuthenticated, queryClient]);

  return null; // Headless provider, renders nothing directly
}

import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message, PaginatedMessage } from "@/entities/message";

export interface QueryData {
  pageParams: string[];
  pages: PaginatedMessage[];
}

export function useChatRoom(channelId: string) {
  const queryClient = useQueryClient();

  const handleIncomingMessage = (newMessage: Message) => {
    if (String(newMessage.channelId) !== String(channelId)) return;

    queryClient.setQueryData(["messages", channelId], (oldData: QueryData) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      // First look for an optimistic version to replace across ALL pages
      const pageIndex = updatedPages.findIndex((page: PaginatedMessage) =>
        page.messages.some((m: Message) => m.clientId === newMessage.clientId),
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
        // Append the new message to Page 0 (the absolute latest timeline block)
        updatedPages[0] = {
          ...updatedPages[0],
          messages: [...updatedPages[0].messages, newMessage],
        };
      }

      return { ...oldData, pages: updatedPages };
    });
  };

  useEffect(() => {
    if (!channelId) return;

    // Join room on mount
    webSocketClient.emit("join_channel", { channelId });
    // Mark messages as read on mount
    webSocketClient.emit("mark_as_read", { channelId });
    // Listen for incoming messages
    webSocketClient.on("receive_message", handleIncomingMessage);

    // Cleanup to prevent duplicate listeners
    return () => {
      // Stop listening to events for this specific hook instance
      webSocketClient.off("receive_message", handleIncomingMessage);
      // Tell the server to stop sending messages for this channel to this socket
      webSocketClient.emit("leave_channel", { channelId });
    };
  }, [channelId]);
}

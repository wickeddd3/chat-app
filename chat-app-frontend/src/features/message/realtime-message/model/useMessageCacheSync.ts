import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@/entities/message";

export function useMessageCacheSync() {
  const queryClient = useQueryClient();

  const handleIncomingMessage = useCallback(
    (newMessage: Message) => {
      queryClient.setQueryData(
        ["messages", String(newMessage.channelId)],
        (oldData: { pages: { messages: Message[] }[] }) => {
          if (!oldData) return oldData;

          const updatedPages = [...oldData.pages];

          // First look for an optimistic version to replace across ALL pages
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
            // Append the new message to Page 0 (the absolute latest timeline block)
            updatedPages[0] = {
              ...updatedPages[0],
              messages: [...updatedPages[0].messages, newMessage],
            };
          }

          return { ...oldData, pages: updatedPages };
        },
      );
    },
    [queryClient],
  );

  useEffect(() => {
    // Listen for incoming messages
    webSocketClient.on("receive_message", handleIncomingMessage);

    // Cleanup to prevent duplicate listeners
    return () => {
      // Stop listening to events for this specific hook instance
      webSocketClient.off("receive_message");
    };
  }, [handleIncomingMessage]);
}

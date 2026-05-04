import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect, useState } from "react";
import type { Message } from "@/entities/message";

export function useChatRoom(channelId: string, messages: Message[]) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const handleIncomingMessage = (newMessage: any) => {
    // IMPORTANT: Only process if the message belongs to this specific channel
    // if (String(newMessage.channelId) !== String(channelId)) return;

    setChatHistory((prev) => {
      // Check if we already have this message (via clientId)
      const exists = prev.find(
        (message) => message.clientId === newMessage.clientId,
      );

      if (exists) {
        // Replace the optimistic message with the permanent one from the server
        return prev.map((message) =>
          message.clientId === newMessage.clientId
            ? { ...newMessage, isSending: false }
            : message,
        );
      }

      // If it's a message from someone else, just append it
      return [...prev, newMessage];
    });
  };

  useEffect(() => {
    if (!channelId) return;

    // Join room on mount
    webSocketClient.emit("join_channel", channelId);
    // Listen for incoming messages
    webSocketClient.on("receive_message", handleIncomingMessage);

    // Cleanup to prevent duplicate listeners
    return () => {
      // Stop listening to events for this specific hook instance
      webSocketClient.off("receive_message", handleIncomingMessage);
      // Tell the server to stop sending messages for this channel to this socket
      webSocketClient.emit("leave_channel", channelId);
    };
  }, [channelId]);

  useEffect(() => {
    if (messages) {
      setChatHistory(messages);
    }
  }, [messages]);

  return { chatHistory, setChatHistory };
}

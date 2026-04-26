import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect, useState } from "react";
import { useMessages } from "./useMessages";

export function useChatRoom(roomId: string) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const { data: messages } = useMessages(roomId);

  const handleIncomingMessage = (newMessage: any) => {
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
    // Join room on mount
    webSocketClient.emit("join_room", roomId);

    // Listen for incoming messages
    webSocketClient.on("receive_message", handleIncomingMessage);

    // Cleanup to prevent duplicate listeners
    return () => {
      webSocketClient.off("receive_message");
    };
  }, [roomId]);

  useEffect(() => {
    if (messages) {
      setChatHistory(messages);
    }
  }, [messages]);

  return { chatHistory, setChatHistory };
}

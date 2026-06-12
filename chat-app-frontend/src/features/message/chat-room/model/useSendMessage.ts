import { useAuthProfile } from "@/entities/auth";
import type { NewMessage } from "@/entities/message";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useSendMessage({ channelId }: { channelId: string }) {
  const { authProfile } = useAuthProfile();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");

  const handleOptimisticMessage = (newMessage: NewMessage) => {
    queryClient.setQueryData(["messages", channelId], (oldData: any) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      // Push optimistic items to page 0, because it represents the newest timeline batch
      updatedPages[0] = {
        ...updatedPages[0],
        messages: [...updatedPages[0].messages, newMessage],
      };

      // Push optimistic updates into the cache
      return { ...oldData, pages: updatedPages };
    });
  };

  const handleSendMessageToServer = ({
    channelId,
    clientId,
    message,
  }: {
    channelId: string;
    clientId: string;
    message: string;
  }) => {
    // Emit message to websocket server
    webSocketClient.emit("send_message", {
      channelId,
      clientId,
      content: message,
    });
  };

  const sendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (message.trim() === "") return;

    // 1. Generate a temporary unique ID
    const clientId = window.crypto.randomUUID();

    // 2. Create the message object with optimistic data
    const messageData = {
      clientId,
      channelId,
      content: message,
      author: {
        id: authProfile?.id,
        name: authProfile?.name,
        image: authProfile?.image,
      },
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    // 3. Update UI immediately
    handleOptimisticMessage(messageData);

    // 4. Send to server
    handleSendMessageToServer({ channelId, clientId, message });

    // 5. Reset message input
    setMessage("");
  };

  return {
    message,
    setMessage,
    sendMessage,
  };
}

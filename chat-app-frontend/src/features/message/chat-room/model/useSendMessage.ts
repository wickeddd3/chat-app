import { useAuth } from "@/entities/auth";
import { useAuthProfile } from "@/entities/auth";
import type { Message, NewMessage } from "@/entities/message";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ReplyTarget } from "./useReplyTarget";

export interface UseSendMessageParams {
  channelId: string;
  /** The message being replied to, when the composer has one staged. */
  replyTarget?: ReplyTarget | null;
  /** Fired after a send, so the owner can clear the staged reply. */
  onSent?: () => void;
}

export function useSendMessage({
  channelId,
  replyTarget = null,
  onSent,
}: UseSendMessageParams) {
  const { authUser } = useAuth();
  const { authProfile } = useAuthProfile(authUser?.id);
  const queryClient = useQueryClient();
  const keys = createQueryKeys(authUser?.id);
  const [message, setMessage] = useState("");

  const handleOptimisticMessage = (newMessage: NewMessage) => {
    queryClient.setQueryData(
      // Must match the timeline key useMessages reads + handleIncomingMessage
      // reconciles against, or the optimistic message writes to a phantom cache
      // entry and the sender never sees their own message.
      keys.messages.timeline(channelId),
      (oldData: { pages: { messages: (Message | NewMessage)[] }[] }) => {
        if (!oldData) return oldData;

        const updatedPages = [...oldData.pages];

        // Push optimistic items to page 0, because it represents the newest timeline batch
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            messages: [...updatedPages[0].messages, newMessage],
          };
        }

        // Push optimistic updates into the cache
        return { ...oldData, pages: updatedPages };
      },
    );
  };

  const handleSendMessageToServer = ({
    channelId,
    clientId,
    message,
    parentId,
  }: {
    channelId: string;
    clientId: string;
    message: string;
    parentId?: string;
  }) => {
    // Emit message to websocket server. `parentId` is omitted entirely on a
    // plain send — the server's schema takes it as optional, not nullable.
    webSocketClient.emit("message:send_message", {
      channelId,
      clientId,
      content: message,
      ...(parentId && { parentId }),
    });
  };

  const sendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (message.trim() === "") return;

    // 1. Generate a temporary unique ID
    const clientId = window.crypto.randomUUID();

    // 2. Create the message object with optimistic data. The staged reply is
    // carried as its own quote, so the bubble renders complete before the
    // server echoes it back.
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
      ...(replyTarget && { parentId: replyTarget.id, parent: replyTarget }),
    };

    // 3. Update UI immediately
    handleOptimisticMessage(messageData);

    // 4. Send to server
    handleSendMessageToServer({
      channelId,
      clientId,
      message,
      ...(replyTarget && { parentId: replyTarget.id }),
    });

    // 5. Reset message input and retire the staged reply
    setMessage("");
    onSent?.();
  };

  return {
    message,
    setMessage,
    sendMessage,
  };
}

import { webSocketClient } from "@/shared/lib/socket-io.client";

export function useMarkAsRead(): {
  markAsRead: (channelId: string | undefined) => void;
} {
  const markAsRead = (channelId: string | undefined) => {
    webSocketClient.emit("message:mark_as_read", { channelId });
  };

  return { markAsRead };
}

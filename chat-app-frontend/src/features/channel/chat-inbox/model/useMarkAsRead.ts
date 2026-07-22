import { useCallback } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

export function useMarkAsRead(): {
  markAsRead: (channelId: string | undefined) => void;
} {
  const markAsRead = useCallback((channelId: string | undefined) => {
    webSocketClient.emit("message:mark_as_read", { channelId });
  }, []);

  return { markAsRead };
}

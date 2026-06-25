import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";

export function useChatRoom(channelId: string) {
  useEffect(() => {
    if (!channelId) return;

    // Join room on mount
    webSocketClient.emit("join_channel", { channelId });

    // Cleanup to prevent duplicate listeners
    return () => {
      // Tell the server to stop sending messages for this channel to this socket
      webSocketClient.emit("leave_channel", { channelId });
    };
  }, [channelId]);
}

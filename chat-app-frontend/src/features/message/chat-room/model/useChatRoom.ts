import { webSocketClient } from "@/shared/lib/socket-io.client";
import { setActiveChannel } from "@/shared/utils/active-channel";
import { useEffect } from "react";

export function useChatRoom(channelId: string) {
  useEffect(() => {
    if (!channelId) return;

    // Mark this as the channel the user is viewing so incoming messages for it
    // are auto-read (see message-receive.handler) instead of bumping unread.
    setActiveChannel(channelId);

    // Join room on mount
    webSocketClient.emit("channel:join_channel", { channelId });

    // Mark any already-unread messages as read on entry
    webSocketClient.emit("message:mark_as_read", { channelId });

    // Cleanup to prevent duplicate listeners
    return () => {
      setActiveChannel(null);
      // Tell the server to stop sending messages for this channel to this socket
      webSocketClient.emit("channel:leave_channel", { channelId });
    };
  }, [channelId]);
}

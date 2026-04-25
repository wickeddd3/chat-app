import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect, useState } from "react";

export function useChatRoom(room: string) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    // Join room on mount
    webSocketClient.emit("join_room", room);

    // Listen for incoming messages
    webSocketClient.on("receive_message", (data) => {
      // console.log(data);
      setChatHistory((prev) => [...prev, data]);
    });

    // Cleanup to prevent duplicate listeners
    return () => {
      webSocketClient.off("receive_message");
    };
  }, [room]);

  return { chatHistory, setChatHistory };
}

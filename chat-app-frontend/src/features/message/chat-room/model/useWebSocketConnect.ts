import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";

export function useWebSocketConnect(roomId: boolean) {
  useEffect(() => {
    // Only connect if roomId is ready
    if (roomId) {
      webSocketClient.connect();

      webSocketClient.on("connect_error", (err) => {
        console.error("Auth failed on socket:", err.message);
      });

      return () => {
        webSocketClient.disconnect();
      };
    }
  }, [roomId]);
}

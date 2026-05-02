import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";

export function useWebSocketConnect(isAuthenticated: boolean) {
  useEffect(() => {
    // Only connect if authenticated
    if (isAuthenticated) {
      webSocketClient.connect();

      webSocketClient.on("connect_error", (err) => {
        console.error("Auth failed on socket:", err.message);
      });

      return () => {
        webSocketClient.disconnect();
      };
    }
  }, [isAuthenticated]);
}

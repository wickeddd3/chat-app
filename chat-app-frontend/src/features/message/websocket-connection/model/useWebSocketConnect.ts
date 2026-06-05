import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";

export function useWebSocketConnect(isAuthenticated: boolean) {
  useEffect(() => {
    // Only connect if authenticated
    if (isAuthenticated) {
      webSocketClient.connect();

      return () => {
        webSocketClient.disconnect();
      };
    }
  }, [isAuthenticated]);
}

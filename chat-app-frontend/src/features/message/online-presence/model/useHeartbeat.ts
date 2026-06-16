import { useEffect } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

export const useHeartbeat = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    // Send a pulse immediately
    webSocketClient.emit("heartbeat");

    // Send a pulse every 30 seconds
    const interval = setInterval(() => {
      if (webSocketClient.connected) {
        webSocketClient.emit("heartbeat");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

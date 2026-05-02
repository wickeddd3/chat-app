// client/src/shared/hooks/useHeartbeat.ts
import { useEffect } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

export const useHeartbeat = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    // Send a pulse immediately
    webSocketClient.emit("heartbeat");

    // Send a pulse every 20 seconds
    const interval = setInterval(() => {
      if (webSocketClient.connected) {
        webSocketClient.emit("heartbeat");
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

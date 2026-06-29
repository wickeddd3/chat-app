import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { createQueryKeys } from "@/shared/config/react-query-keys";

import { handleStatusChange } from "./connection-status.handler";
import { handleIncomingMessage } from "./message-receive.handler";
import { handleClearUnread } from "./message-read.handler";
import { handleIncomingNotification } from "./notification-new.handler";
import { handleNewRequest } from "./request-new.handler";
import { handleAcceptedRequest } from "./request-accepted.handler";
import { handleCanceledRequest } from "./request-canceled.handler";
import { handleDeclinedRequest } from "./request-declined.handler";

export function SocketOrchestrator({ authId }: { authId: string | undefined }) {
  const queryClient = useQueryClient();
  const queryKeys = createQueryKeys(authId);

  // 1. GLOBAL CORE CONNECTION LIFECYCLE
  useEffect(() => {
    if (!authId) {
      if (webSocketClient.connected) webSocketClient.disconnect();
      return;
    }

    webSocketClient.connect();

    return () => {
      webSocketClient.disconnect();
    };
  }, [authId]);

  // 2. GLOBAL HEARTBEAT LEASE TICK
  useEffect(() => {
    if (!authId) return;

    webSocketClient.emit("connection:heartbeat");

    const interval = setInterval(() => {
      if (webSocketClient.connected) {
        webSocketClient.emit("connection:heartbeat");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authId]);

  // 3. GLOBAL BACKGROUND EVENTS (Matrix Sync, Notifications, Inbox Badges, Message Sync)
  useEffect(() => {
    if (!authId) return;

    const onStatusChange = (payload: any) =>
      handleStatusChange(queryClient, queryKeys, payload);
    const onIncomingMessage = (payload: any) =>
      handleIncomingMessage(queryClient, queryKeys, payload);
    const onClearUnread = (payload: any) =>
      handleClearUnread(queryClient, queryKeys, payload);
    const onIncomingNotification = (payload: any) =>
      handleIncomingNotification(queryClient, queryKeys, payload);
    const onNewRequest = (payload: any) =>
      handleNewRequest(queryClient, queryKeys, payload);
    const onAcceptedRequest = (payload: any) =>
      handleAcceptedRequest(queryClient, queryKeys, payload);
    const onCanceledRequest = (payload: any) =>
      handleCanceledRequest(queryClient, queryKeys, payload);
    const onDeclinedRequest = (payload: any) =>
      handleDeclinedRequest(queryClient, queryKeys, payload);

    // Mount Listeners securely
    webSocketClient.on("connection:status_change", onStatusChange);
    webSocketClient.on("message:receive_message", onIncomingMessage);
    webSocketClient.on("message:read", onClearUnread);
    webSocketClient.on("notification:new", onIncomingNotification);
    webSocketClient.on("request:new", onNewRequest);
    webSocketClient.on("request:accepted", onAcceptedRequest);
    webSocketClient.on("request:canceled", onCanceledRequest);
    webSocketClient.on("request:declined", onDeclinedRequest);

    // Explicit function reference tear-down to avoid silent memory leaks
    return () => {
      webSocketClient.off("connection:status_change", onStatusChange);
      webSocketClient.off("message:receive_message", onIncomingMessage);
      webSocketClient.off("message:read", onClearUnread);
      webSocketClient.off("notification:new", onIncomingNotification);
      webSocketClient.off("request:new", onNewRequest);
      webSocketClient.off("request:accepted", onAcceptedRequest);
      webSocketClient.off("request:canceled", onCanceledRequest);
      webSocketClient.off("request:declined", onDeclinedRequest);
    };
  }, [authId, queryClient, queryKeys]);

  return null; // Headless provider, renders nothing directly
}

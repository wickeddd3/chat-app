import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webSocketClient } from "@/shared/lib/socket-io.client";

import { handleStatusChange } from "./connection-status.handler";
import { handleIncomingMessage } from "./message-receive.handler";
import { handleClearUnread } from "./message-read.handler";
import { handleIncomingNotification } from "./notification-new.handler";
import { handleNewRequest } from "./request-new.handler";
import { handleAcceptedRequest } from "./request-accepted.handler";
import { handleCanceledRequest } from "./request-canceled.handler";
import { handleDeclinedRequest } from "./request-declined.handler";

interface SocketOrchestratorProps {
  isAuthenticated: boolean;
}

export function SocketOrchestrator({
  isAuthenticated,
}: SocketOrchestratorProps) {
  const queryClient = useQueryClient();

  // 1. GLOBAL CORE CONNECTION LIFECYCLE
  useEffect(() => {
    if (!isAuthenticated) {
      if (webSocketClient.connected) webSocketClient.disconnect();
      return;
    }

    webSocketClient.connect();

    return () => {
      webSocketClient.disconnect();
    };
  }, [isAuthenticated]);

  // 2. GLOBAL HEARTBEAT LEASE TICK
  useEffect(() => {
    if (!isAuthenticated) return;

    webSocketClient.emit("connection:heartbeat");

    const interval = setInterval(() => {
      if (webSocketClient.connected) {
        webSocketClient.emit("connection:heartbeat");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 3. GLOBAL BACKGROUND EVENTS (Matrix Sync, Notifications, Inbox Badges, Message Sync)
  useEffect(() => {
    if (!isAuthenticated) return;

    const onStatusChange = (payload: any) =>
      handleStatusChange(queryClient, payload);
    const onIncomingMessage = (payload: any) =>
      handleIncomingMessage(queryClient, payload);
    const onClearUnread = (payload: any) =>
      handleClearUnread(queryClient, payload);
    const onIncomingNotification = (payload: any) =>
      handleIncomingNotification(queryClient, payload);
    const onNewRequest = (payload: any) =>
      handleNewRequest(queryClient, payload);
    const onAcceptedRequest = (payload: any) =>
      handleAcceptedRequest(queryClient, payload);
    const onCanceledRequest = (payload: any) =>
      handleCanceledRequest(queryClient, payload);
    const onDeclinedRequest = (payload: any) =>
      handleDeclinedRequest(queryClient, payload);

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
  }, [isAuthenticated, queryClient]);

  return null; // Headless provider, renders nothing directly
}

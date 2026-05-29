import { eventDispatcher } from "@/lib/event-dispatcher";
import { notificationCreated } from "./notification.handler";

export function registerWebSocketHandlers() {
  // Register broadcast handlers
  eventDispatcher.on("notification:created", notificationCreated);
}

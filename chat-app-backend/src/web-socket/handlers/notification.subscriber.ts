import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Notification } from "@/prisma/client";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

@injectable()
export class NotificationSubscriber {
  constructor(@inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster) {
    this.handleNotificationCreated = this.handleNotificationCreated.bind(this);
  }

  public handleNotificationCreated = async (notification: Notification): Promise<void> => {
    await this.broadcaster.emitToUser(notification.userId, "new_notification", notification);
  };
}

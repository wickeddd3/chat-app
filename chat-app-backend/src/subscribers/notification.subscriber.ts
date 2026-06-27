import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Notification } from "@/prisma/client";
import { BroadcasterService } from "@/services/broadcaster.service";

@injectable()
export class NotificationSubscriber {
  constructor(@inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService) {
    this.handleNotificationCreated = this.handleNotificationCreated.bind(this);
  }

  public handleNotificationCreated = async (notification: Notification): Promise<void> => {
    await this.broadcaster.emitToUser(notification.userId, "notification:new", notification);
  };
}

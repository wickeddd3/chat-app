import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationsRepository } from "./notifications.repository";
import type { PaginatedNotifications } from "./notifications.types";

@injectable()
export class NotificationsService {
  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository) {}

  public async getByUserId({
    userId,
    isRead,
    limit = 20,
    cursor,
  }: {
    userId: string;
    isRead?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedNotifications> {
    try {
      return await this.notificationsRepository.getByUserId({ userId, ...(isRead && { isRead }), limit });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve notifications");
    }
  }

  public async markAsRead({ userId, notificationIds }: { userId: string; notificationIds: string[] }) {
    try {
      return await this.notificationsRepository.markAsRead({ userId, notificationIds });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to mark notifications as read");
    }
  }
}

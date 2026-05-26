import { NotificationsRepository } from "./notifications.repository";
import type { PaginatedNotifications } from "./notification.types";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();

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

import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationsRepository } from "./notifications.repository";
import type { PaginatedNotifications } from "./notifications.types";
import { HttpException } from "@/utils/http.exception";

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
      return await this.notificationsRepository.getByUserId({
        userId,
        ...(typeof isRead === "boolean" && { isRead }),
        limit,
        cursor,
      });
    } catch (error) {
      throw new HttpException(500, "An error occurred while compiling your notification timeline feed.", null, {
        cause: error,
      });
    }
  }

  public async markAsRead({
    userId,
    notificationIds,
  }: {
    userId: string;
    notificationIds: string[];
  }): Promise<{ count: number }> {
    try {
      return await this.notificationsRepository.markAsRead({ userId, notificationIds });
    } catch (error) {
      throw new HttpException(500, "Failed to update notification read statuses. Please try again.", null, {
        cause: error,
      });
    }
  }
}

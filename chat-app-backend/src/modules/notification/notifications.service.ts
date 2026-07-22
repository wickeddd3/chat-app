import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationsRepository } from "./persistence/notifications.repository";
import { NotificationsQuery } from "./persistence/notifications.query";
import type { PaginatedNotifications } from "./notifications.types";

/**
 * Notification orchestration — thin: the feed read goes to the query, the
 * mark-as-read write to the repository. Domain errors propagate unchanged.
 */
@injectable()
export class NotificationsService {
  constructor(
    @inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository,
    @inject(TYPES.NotificationsQuery) private notificationsQuery: NotificationsQuery,
  ) {}

  public async getByUserId(params: {
    userId: string;
    isRead?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedNotifications> {
    return this.notificationsQuery.getByUserId(params);
  }

  public async markAsRead(params: { userId: string; notificationIds: string[] }): Promise<{ count: number }> {
    return this.notificationsRepository.markAsRead(params);
  }
}

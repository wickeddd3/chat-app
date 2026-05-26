import { prisma } from "@/lib/prisma";
import type { PaginatedNotifications } from "./notification.types";

export class NotificationsRepository {
  private db = prisma;

  /**
   * Retrieves a list of notifications for the current user.
   * Ordered chronologically descending (newest alerts first).
   */
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
      const notifications = await this.db.notification.findMany({
        where: {
          userId,
          // If isRead is explicitly provided (true/false), apply the filter.
          // Otherwise, fetch both read and unread records.
          ...(typeof isRead === "boolean" && { isRead }),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor item itself to avoid duplication
        }),
      });

      let nextCursor: string | null = null;
      let hasMore = false;

      // If we returned limit + 1 items, it means there are older records to fetch
      if (notifications.length > limit) {
        hasMore = true;
        // Pop the extra item off the array and use its ID as the next cursor boundary
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return {
        notifications,
        nextCursor,
        hasMore,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve notifications");
    }
  }

  /**
   * Utility Method: Marks a list of specific notifications as read.
   */
  public async markAsRead({ userId, notificationIds }: { userId: string; notificationIds: string[] }) {
    try {
      return await this.db.notification.updateMany({
        where: {
          userId, // Safety mechanism: ensure users can only modify their own items
          id: { in: notificationIds },
        },
        data: {
          isRead: true,
        },
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to mark notifications as read");
    }
  }
}

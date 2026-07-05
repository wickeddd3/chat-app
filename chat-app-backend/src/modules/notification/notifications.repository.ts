import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { PaginatedNotifications } from "./notifications.types";
import { HttpException } from "@/utils/http.exception";
import { decodeCursor, encodeCursor } from "@/utils/cursor";

@injectable()
export class NotificationsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async getUnreadNotificationsCount({ authUserId }: { authUserId: string }): Promise<number> {
    try {
      const unreadCount = await this.db.notification.count({
        where: {
          userId: authUserId,
          isRead: false,
        },
      });

      return unreadCount;
    } catch (error) {
      throw new HttpException(500, "An error occurred while retrieving notifications unread count", null, {
        cause: error,
      });
    }
  }

  /**
   * Retrieves a list of notifications based on userId.
   * Ordered chronologically descending (newest alerts first).
   */
  public async getByUserId({
    userId,
    isRead,
    limit = 20,
    cursor = "",
  }: {
    userId: string;
    isRead?: boolean;
    limit?: number;
    cursor?: string | undefined; // Opaque keyset token (base64url)
  }): Promise<PaginatedNotifications> {
    try {
      const decoded = decodeCursor(cursor);
      const notifications = await this.db.notification.findMany({
        where: {
          userId,
          // If isRead is explicitly provided (true/false), apply the filter.
          // Otherwise, fetch both read and unread records.
          ...(typeof isRead === "boolean" && { isRead }),
          // Keyset cursor: (createdAt, id) strictly before (older than) the boundary.
          ...(decoded && {
            OR: [{ createdAt: { lt: decoded.timestamp } }, { createdAt: decoded.timestamp, id: { lt: decoded.id } }],
          }),
        },
        // Order by createdAt first, then id as a deterministic tiebreaker.
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        // Fetch one extra to reliably determine hasMore.
        take: limit + 1,
      });

      const hasMore = notifications.length > limit;
      const pageItems = hasMore ? notifications.slice(0, limit) : notifications;

      // The oldest item in this (descending) page is the boundary for the next
      // (older) page.
      const oldest = pageItems.at(-1);
      const nextCursor = hasMore && oldest ? encodeCursor(oldest.createdAt, oldest.id) : null;

      return {
        notifications: pageItems,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      throw new HttpException(500, "An error occurred while compiling your notification timeline feed.", null, {
        cause: error,
      });
    }
  }

  /**
   *  Marks a list of specific notifications as read.
   */
  public async markAsRead({
    userId,
    notificationIds,
  }: {
    userId: string;
    notificationIds: string[];
  }): Promise<{ count: number }> {
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
    } catch (error) {
      throw new HttpException(500, "Failed to update notification read statuses. Please try again.", null, {
        cause: error,
      });
    }
  }
}

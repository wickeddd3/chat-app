import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Notification, NotificationType } from "@/prisma/client";
import type { NewNotification, PaginatedNotifications } from "./notifications.types";
import { HttpException } from "@/utils/http.exception";
import { decodeCursor, encodeCursor } from "@/utils/cursor";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";

@injectable()
export class NotificationsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /** Falls back to the pooled client when the caller isn't inside a transaction. */
  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /**
   * Persists a notification composed by another module.
   *
   * The `executor` parameter is what lets a caller write a notification in the
   * same transaction as the event that caused it, without reaching into this
   * table directly.
   */
  public async create(data: NewNotification, executor?: Executor): Promise<Notification> {
    return withPersistence("Failed to create the notification.", () =>
      this.client(executor).notification.create({ data }),
    );
  }

  /**
   * Marks a user's notifications for a given subject as read — used to retire an
   * alert once its subject has been acted on (e.g. accepting a request clears the
   * incoming-request alert).
   */
  public async markReadByReference(
    { referenceId, userId }: { referenceId: string; userId: string },
    executor?: Executor,
  ): Promise<void> {
    await withPersistence("Failed to mark the notification as read.", () =>
      this.client(executor).notification.updateMany({
        where: { referenceId, userId },
        data: { isRead: true },
      }),
    );
  }

  /** Removes a user's notifications for a subject that no longer exists. */
  public async deleteByReference(
    { referenceId, userId, type }: { referenceId: string; userId: string; type: NotificationType },
    executor?: Executor,
  ): Promise<void> {
    await withPersistence("Failed to delete the notification.", () =>
      this.client(executor).notification.deleteMany({ where: { referenceId, userId, type } }),
    );
  }

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
      // Shared by the page query and the total count, so the badge always agrees
      // with the list it labels. The cursor is layered on separately below —
      // only the page query paginates.
      const baseWhere = {
        userId,
        // If isRead is explicitly provided (true/false), apply the filter.
        // Otherwise, fetch both read and unread records.
        ...(typeof isRead === "boolean" && { isRead }),
      };

      const [notifications, total] = await Promise.all([
        this.db.notification.findMany({
          where: {
            ...baseWhere,
            // Keyset cursor: (createdAt, id) strictly before (older than) the boundary.
            ...(decoded && {
              OR: [{ createdAt: { lt: decoded.timestamp } }, { createdAt: decoded.timestamp, id: { lt: decoded.id } }],
            }),
          },
          // Order by createdAt first, then id as a deterministic tiebreaker.
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          // Fetch one extra to reliably determine hasMore.
          take: limit + 1,
        }),
        this.db.notification.count({ where: baseWhere }),
      ]);

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
        total,
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
          isRead: false, // Only flip unread ones, so `count` = number actually newly read
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

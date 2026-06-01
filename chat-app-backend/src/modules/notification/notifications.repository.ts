import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { PaginatedNotifications } from "./notifications.types";

@injectable()
export class NotificationsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

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
    cursor?: string | undefined; // Format expected: "ISOString_id"
  }): Promise<PaginatedNotifications> {
    try {
      let cursorFilter = undefined;

      // 1. If a composite cursor is supplied, unpack its properties
      if (cursor) {
        const [cursorCreatedAt, cursorId] = cursor.split("_");

        if (cursorCreatedAt && cursorId) {
          cursorFilter = {
            createdAt: new Date(cursorCreatedAt),
            id: cursorId,
          };
        }
      }

      // 2. Fetch notifications matching filters
      const notifications = await this.db.notification.findMany({
        where: {
          userId,
          // If isRead is explicitly provided (true/false), apply the filter.
          // Otherwise, fetch both read and unread records.
          ...(typeof isRead === "boolean" && { isRead }),
        },
        // We order by createdAt first, then fall back to ID for deterministic tie-breaking
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        // Apply the Prisma compound cursor strategy
        ...(cursorFilter && {
          cursor: {
            // Ensure your schema has an index supporting this compound criteria
            createdAt_id: cursorFilter,
          },
          skip: 1, // Skip the exact cursor item boundary to yield new rows
        }),
      });

      let nextCursor: string | null = null;
      let hasMore = false;

      // 3. Evaluate page truncation boundary conditions
      // If we returned limit + 1 items, it means there are older records to fetch
      if (notifications.length > limit) {
        hasMore = true;
        // Pop the extra item off the array and use its ID as the next cursor boundary
        const nextItem = notifications.pop();

        if (nextItem) {
          // Serialize the compound properties together to build the next cursor token string
          nextCursor = `${nextItem.createdAt.toISOString()}_${nextItem.id}`;
        }
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to mark notifications as read");
    }
  }
}

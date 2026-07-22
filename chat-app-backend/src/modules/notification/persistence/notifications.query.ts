import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient, Prisma } from "@/prisma/client";
import type { PaginatedNotifications } from "../notifications.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { buildKeysetPage, keysetFilter, keysetTake } from "@/shared/persistence/keyset-pagination";

/**
 * Read side of the notification module: the timeline feed and the unread badge
 * count. No mutations.
 */
@injectable()
export class NotificationsQuery {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async getUnreadNotificationsCount({ authUserId }: { authUserId: string }): Promise<number> {
    return withPersistence("Failed to retrieve unread notifications count.", () =>
      this.db.notification.count({ where: { userId: authUserId, isRead: false } }),
    );
  }

  /**
   * A user's notifications, newest-first. `total` is computed from the same
   * predicate as the page (minus the cursor) so the badge always agrees with the
   * list it labels, including under the isRead filter.
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
    cursor?: string;
  }): Promise<PaginatedNotifications> {
    return withPersistence("Failed to compile the notification timeline feed.", async () => {
      const baseWhere: Prisma.NotificationWhereInput = {
        userId,
        // Apply the filter only when isRead is explicitly true/false; otherwise
        // return both read and unread.
        ...(typeof isRead === "boolean" && { isRead }),
      };

      const [rows, total] = await Promise.all([
        this.db.notification.findMany({
          where: { ...baseWhere, AND: keysetFilter<Prisma.NotificationWhereInput>("createdAt", cursor) },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: keysetTake(limit),
        }),
        this.db.notification.count({ where: baseWhere }),
      ]);

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.createdAt,
        idOf: (row) => row.id,
        map: (row) => row,
      });

      return { notifications: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor, total };
    });
  }
}

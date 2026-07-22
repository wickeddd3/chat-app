import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Notification, NotificationType } from "@/prisma/client";
import type { NewNotification } from "../notifications.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";

/**
 * Write side of the notification module. This table has a single owner: other
 * modules compose a `NewNotification` and hand it here (optionally inside their
 * own transaction via `executor`) rather than writing the table themselves.
 */
@injectable()
export class NotificationsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /** Falls back to the pooled client when the caller isn't inside a transaction. */
  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /** Persists a notification composed by another module. */
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

  /**
   * Marks a specific list of the user's notifications as read, returning how many
   * were actually flipped (already-read ones don't count). Scoped to `userId` so
   * a caller can only modify their own.
   */
  public async markAsRead(
    { userId, notificationIds }: { userId: string; notificationIds: string[] },
    executor?: Executor,
  ): Promise<{ count: number }> {
    return withPersistence("Failed to update notification read statuses.", () =>
      this.client(executor).notification.updateMany({
        where: { userId, id: { in: notificationIds }, isRead: false },
        data: { isRead: true },
      }),
    );
  }
}

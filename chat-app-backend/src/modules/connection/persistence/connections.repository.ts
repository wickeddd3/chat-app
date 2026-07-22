import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Connection } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { USER_PROFILE_SELECT } from "@/shared/persistence/selectors";
import type { Executor } from "@/shared/persistence/transaction";
import type { ConnectionWithParties } from "../connections.types";

/** Both parties' profiles, as every write path returns them for fan-out. */
const WITH_PARTIES = {
  sender: { select: USER_PROFILE_SELECT },
  receiver: { select: USER_PROFILE_SELECT },
} as const;

/**
 * Write side of the connection module: loads and mutations on the Connection
 * aggregate, and nothing else.
 *
 * Deliberately free of authorization checks, notification writes and response
 * shaping — those moved to `connections.policy.ts`, the notifications module,
 * and `connections.mapper.ts` respectively. Every method takes an optional
 * `executor` so a service can enlist it in a cross-module transaction.
 */
@injectable()
export class ConnectionsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /** Falls back to the pooled client when the caller isn't inside a transaction. */
  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  public async findById(connectionId: string, executor?: Executor): Promise<Connection | null> {
    return withPersistence("Failed to load the connection.", () =>
      this.client(executor).connection.findUnique({ where: { id: connectionId } }),
    );
  }

  /** Looks for an existing connection between two users, in either direction. */
  public async findBetween(userId: string, otherUserId: string, executor?: Executor): Promise<Connection | null> {
    return withPersistence("Failed to look up the existing connection.", () =>
      this.client(executor).connection.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    );
  }

  public async create(
    { senderId, receiverId }: { senderId: string; receiverId: string },
    executor?: Executor,
  ): Promise<ConnectionWithParties> {
    return withPersistence("Failed to create the connection request.", () =>
      this.client(executor).connection.create({
        data: { senderId, receiverId, status: "PENDING" },
        include: WITH_PARTIES,
      }),
    );
  }

  public async markAccepted(connectionId: string, executor?: Executor): Promise<ConnectionWithParties> {
    return withPersistence("Failed to accept the connection request.", () =>
      this.client(executor).connection.update({
        where: { id: connectionId },
        data: { status: "ACCEPTED" },
        include: WITH_PARTIES,
      }),
    );
  }

  public async delete(connectionId: string, executor?: Executor): Promise<void> {
    await withPersistence("Failed to delete the connection request.", () =>
      this.client(executor).connection.delete({ where: { id: connectionId } }),
    );
  }
}

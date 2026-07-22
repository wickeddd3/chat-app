import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Channel } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";

/**
 * Write side of the channel module: the `channel` row itself and nothing else.
 *
 * Membership lives in `ChannelMembersRepository`; creating a channel-with-members
 * is a two-table operation the *service* orchestrates in one transaction, so both
 * tables keep a single owner. Authorization moved to `channels.policy.ts`.
 */
@injectable()
export class ChannelsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /** The direct channel between two users, if one already exists (order-independent). */
  public async findExistingDirect(userId: string, targetUserId: string, executor?: Executor): Promise<Channel | null> {
    return withPersistence("Failed to find direct channel.", () =>
      this.client(executor).channel.findFirst({
        where: {
          type: "DIRECT",
          AND: [{ channelMembers: { some: { userId } } }, { channelMembers: { some: { userId: targetUserId } } }],
        },
      }),
    );
  }

  public async createDirect(userId: string, targetUserId: string, executor?: Executor): Promise<Channel> {
    return withPersistence("Failed to create direct channel.", () =>
      this.client(executor).channel.create({
        // Internal name; the client renders the other member's profile instead.
        data: { name: `DM-${userId}-${targetUserId}`, type: "DIRECT", authorId: userId },
      }),
    );
  }

  public async createGroup(authorId: string, name: string, executor?: Executor): Promise<Channel> {
    return withPersistence("Failed to create group channel.", () =>
      this.client(executor).channel.create({
        data: { name, type: "GROUP", authorId },
      }),
    );
  }

  public async rename(channelId: string, name: string, executor?: Executor): Promise<Channel> {
    return withPersistence("Failed to update group channel.", () =>
      this.client(executor).channel.update({ where: { id: channelId }, data: { name } }),
    );
  }

  /** Bumps `updatedAt` so the channel resurfaces to the top of the inbox (e.g. on a new message). */
  public async touch(channelId: string, executor?: Executor): Promise<Channel> {
    return withPersistence("Failed to update channel.", () =>
      this.client(executor).channel.update({ where: { id: channelId }, data: { updatedAt: new Date() } }),
    );
  }
}

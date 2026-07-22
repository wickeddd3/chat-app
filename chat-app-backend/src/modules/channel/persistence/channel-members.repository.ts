import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";
import type { ChannelMemberRow } from "../channels.members";

/**
 * The `channel_member` table: membership questions (used as authorization guards
 * and fan-out lookups across the app) and membership writes.
 *
 * The reads here are exact-index point lookups, not list projections, so they sit
 * with the membership writes rather than in `ChannelsQuery`. Writes take an
 * `Executor` so the service can enlist them in a channel-creation transaction.
 */
@injectable()
export class ChannelMembersRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /** Authorization guard for message read/write paths. Uses the (channelId, userId) unique index. */
  public async isMember(userId: string, channelId: string, executor?: Executor): Promise<boolean> {
    return withPersistence("Failed to verify channel membership.", async () => {
      const member = await this.client(executor).channelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
        select: { id: true },
      });
      return member !== null;
    });
  }

  /** Authorization guard for group-management paths. */
  public async isAdmin(userId: string, channelId: string, executor?: Executor): Promise<boolean> {
    return withPersistence("Failed to verify channel admin role.", async () => {
      const member = await this.client(executor).channelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
        select: { role: true },
      });
      return member?.role === "ADMIN";
    });
  }

  /**
   * Every member id of a channel the requester belongs to (realtime fan-out).
   * Membership-gated: returns `[]` if the requester is not in the channel, so a
   * non-member can't enumerate a channel's roster.
   */
  public async getMemberIds(userId: string, channelId: string, executor?: Executor): Promise<string[]> {
    return withPersistence("Failed to retrieve channel member ids.", async () => {
      const channel = await this.client(executor).channel.findFirst({
        where: { id: channelId, channelMembers: { some: { userId } } },
        select: { channelMembers: { select: { userId: true } } },
      });
      return channel?.channelMembers.map((member) => member.userId) ?? [];
    });
  }

  public async addMembers(rows: ChannelMemberRow[], executor?: Executor): Promise<void> {
    await withPersistence("Failed to add channel members.", () =>
      this.client(executor).channelMember.createMany({ data: rows }),
    );
  }

  /**
   * Replaces a channel's entire roster with `rows`.
   *
   * Deleting and re-creating is simpler and less error-prone than diffing the
   * membership, and it runs inside the caller's transaction so the channel is
   * never briefly memberless.
   */
  public async replaceMembers(channelId: string, rows: ChannelMemberRow[], executor?: Executor): Promise<void> {
    await withPersistence("Failed to update channel members.", async () => {
      const db = this.client(executor);
      await db.channelMember.deleteMany({ where: { channelId } });
      await db.channelMember.createMany({ data: rows });
    });
  }
}

import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Channel } from "@/prisma/client";
import { PresenceService } from "@/services/presence.service";
import { createLogger } from "@/lib/logger";
import { TransactionManager } from "@/shared/persistence/transaction";
import { ChannelsQuery } from "./persistence/channels.query";
import { ChannelsRepository } from "./persistence/channels.repository";
import { ChannelMembersRepository } from "./persistence/channel-members.repository";
import { directMemberRows, groupMemberRows } from "./channels.members";
import { assertIsChannelAdmin } from "./channels.policy";
import type { ChannelFilter, InboxChannel, PaginatedChannels } from "./channels.types";

const log = createLogger("Channels");

/**
 * Orchestrates channel reads and the two-table writes (channel + membership).
 *
 * Creation and group updates open a transaction so the channel and its roster
 * commit together; each table is still owned by its own repository. Domain errors
 * propagate as-is — `errorMiddleware` maps them.
 */
@injectable()
export class ChannelsService {
  constructor(
    @inject(TYPES.ChannelsQuery) private channelsQuery: ChannelsQuery,
    @inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository,
    @inject(TYPES.ChannelMembersRepository) private membersRepository: ChannelMembersRepository,
    @inject(TYPES.TransactionManager) private transaction: TransactionManager,
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
  ) {}

  public async getChannels(params: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
    filter?: ChannelFilter;
  }): Promise<PaginatedChannels> {
    return this.channelsQuery.getChannels(params);
  }

  public async getChannel(userId: string, channelId: string): Promise<InboxChannel | null> {
    return this.channelsQuery.getChannel(userId, channelId);
  }

  /** Authorization guard: is `userId` a member of `channelId`? */
  public async isMember(userId: string, channelId: string): Promise<boolean> {
    return this.membersRepository.isMember(userId, channelId);
  }

  /** Authorization guard: is `userId` an ADMIN of `channelId`? (group management) */
  public async isChannelAdmin(userId: string, channelId: string): Promise<boolean> {
    return this.membersRepository.isAdmin(userId, channelId);
  }

  /** Every member id of a channel the requester belongs to (used for realtime fan-out). */
  public async getMemberIds(userId: string, channelId: string): Promise<string[]> {
    return this.membersRepository.getMemberIds(userId, channelId);
  }

  /** Returns the existing direct channel between the two users, creating one (with both members) if absent. */
  public async findChannelOrCreate(userId: string, targetUserId: string): Promise<Channel> {
    const existing = await this.channelsRepository.findExistingDirect(userId, targetUserId);
    if (existing) return existing;

    return this.transaction.run(async (tx) => {
      const channel = await this.channelsRepository.createDirect(userId, targetUserId, tx);
      await this.membersRepository.addMembers(directMemberRows(channel.id, userId, targetUserId), tx);
      return channel;
    });
  }

  public async createGroupChannel(userId: string, data: { name: string; memberIds: string[] }): Promise<Channel> {
    return this.transaction.run(async (tx) => {
      const channel = await this.channelsRepository.createGroup(userId, data.name, tx);
      await this.membersRepository.addMembers(groupMemberRows(channel.id, userId, data.memberIds), tx);
      return channel;
    });
  }

  public async updateGroupChannel(
    userId: string,
    channelId: string,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel> {
    assertIsChannelAdmin(await this.membersRepository.isAdmin(userId, channelId));

    const updated = await this.transaction.run(async (tx) => {
      const channel = await this.channelsRepository.rename(channelId, data.name, tx);
      await this.membersRepository.replaceMembers(channelId, groupMemberRows(channelId, userId, data.memberIds), tx);
      return channel;
    });

    // Membership may have changed — authoritatively rewrite the cached roster
    // (message fan-out reads it) so removed members stop receiving and added ones
    // start immediately. Awaited so the cache is correct before we respond, but a
    // Redis failure must not fail the already-committed update.
    const memberIds = [userId, ...data.memberIds.filter((id) => id !== userId)];
    try {
      await this.presenceService.refreshChannelMembersLookup(channelId, memberIds);
    } catch (error) {
      log.error({ err: error, channelId }, "Failed to refresh channel members cache");
    }

    return updated;
  }

  /** Bumps the channel to the top of the inbox (e.g. after a new message). */
  public async updateChannel(channelId: string): Promise<Channel> {
    return this.channelsRepository.touch(channelId);
  }
}

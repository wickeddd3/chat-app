import { injectable, inject } from "inversify";
import { EventEmitter } from "events";
import { TYPES } from "@/config/types";
import type { Channel } from "@/prisma/client";
import { PresenceService } from "@/services/presence.service";
import { createLogger } from "@/lib/logger";
import { ConnectionsQuery } from "@/modules/connection/persistence/connections.query";
import { MessagesRepository } from "@/modules/message/persistence/messages.repository";
import { TransactionManager } from "@/shared/persistence/transaction";
import { ChannelsQuery } from "./persistence/channels.query";
import { ChannelsRepository } from "./persistence/channels.repository";
import { ChannelMembersRepository } from "./persistence/channel-members.repository";
import { directMemberRows, groupMemberRows, nextAdminId } from "./channels.members";
import { memberLeftMessage } from "./channels.messages";
import { assertCanLeaveGroup, assertIsChannelAdmin } from "./channels.policy";
import type { ChannelFilter, InboxChannel, LeaveChannelResult, PaginatedChannels } from "./channels.types";

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
    // The connection table is read through its owning module's query, never with
    // a Prisma call of our own.
    @inject(TYPES.ConnectionsQuery) private connectionsQuery: ConnectionsQuery,
    // Leaving narrates itself in the channel; the message table keeps its single
    // owner, so this service composes the copy and hands it to that repository
    // inside its own transaction.
    @inject(TYPES.MessagesRepository) private messagesRepository: MessagesRepository,
    @inject(TYPES.TransactionManager) private transaction: TransactionManager,
    @inject(TYPES.EventDispatcher) private dispatcher: EventEmitter,
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

  /**
   * Authorization guard: may `userId` still post to `channelId`?
   *
   * Membership alone stopped being sufficient once contacts became removable: a
   * direct channel outlives the connection that opened it so the history stays
   * readable, but it accepts no new messages while the two aren't connected.
   * Groups are unaffected — their membership *is* the permission.
   */
  public async canMessage(userId: string, channelId: string): Promise<boolean> {
    const counterpartId = await this.channelsQuery.getDirectCounterpartId(channelId, userId);
    if (!counterpartId) return true;

    return this.connectionsQuery.areConnected(userId, counterpartId);
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

  /**
   * Sets or clears a group's avatar. Admin-only, like every other group-management
   * write — the policy is the single place that decision is made.
   */
  public async updateGroupAvatar(userId: string, channelId: string, image: string | null): Promise<Channel> {
    assertIsChannelAdmin(await this.membersRepository.isAdmin(userId, channelId));

    return this.channelsRepository.setImage(channelId, image);
  }

  /**
   * Removes the caller from a group.
   *
   * Three outcomes, decided from the roster in one transaction:
   *  - **last one out** — the channel is deleted, since nobody could reach it
   *    again; its messages and receipts go with it via the schema's cascades.
   *  - **last admin out** — the longest-standing remaining member inherits ADMIN,
   *    so the group is never left unmanageable.
   *  - **otherwise** — a plain departure.
   *
   * Unless the channel is gone, the exit is narrated by a SYSTEM message so the
   * remaining members see who left. Returns what happened; the caller broadcasts.
   */
  public async leaveGroupChannel(userId: string, channelId: string): Promise<LeaveChannelResult> {
    const channel = await this.channelsQuery.getChannelSummary(channelId);
    assertCanLeaveGroup(channel, await this.membersRepository.isMember(userId, channelId));

    const members = await this.membersRepository.listMembers(channelId);
    const leaver = members.find((member) => member.userId === userId);
    const remainingIds = members.filter((member) => member.userId !== userId).map((member) => member.userId);
    const successorId = nextAdminId(members, userId);
    const isLastMember = remainingIds.length === 0;

    const result = await this.transaction.run(async (tx) => {
      await this.membersRepository.removeMember(channelId, userId, tx);

      if (isLastMember) {
        await this.channelsRepository.delete(channelId, tx);
        return { channelId, remainingMemberIds: [], promotedAdminId: null, channelDeleted: true, systemMessage: null };
      }

      if (successorId) {
        await this.membersRepository.promoteToAdmin(channelId, successorId, tx);
      }

      const systemMessage = await this.messagesRepository.create(
        memberLeftMessage(channelId, userId, leaver?.name ?? "Someone"),
        tx,
      );

      return {
        channelId,
        remainingMemberIds: remainingIds,
        promotedAdminId: successorId,
        channelDeleted: false,
        systemMessage,
      };
    });

    // The cached roster drives message fan-out, so it must stop including the
    // leaver immediately. Awaited so it is correct before we respond, but a Redis
    // failure must not fail the already-committed departure.
    try {
      await this.presenceService.refreshChannelMembersLookup(channelId, remainingIds);
    } catch (error) {
      log.error({ err: error, channelId }, "Failed to refresh channel members cache");
    }

    this.dispatcher.emit("channel:member_left", { ...result, leaverId: userId });

    return result;
  }

  /** Bumps the channel to the top of the inbox (e.g. after a new message). */
  public async updateChannel(channelId: string): Promise<Channel> {
    return this.channelsRepository.touch(channelId);
  }
}

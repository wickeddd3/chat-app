import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { ChannelsRepository } from "./channels.repository";
import type { InboxChannel, PaginatedChannels } from "./channels.types";
import type { Channel } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";
import { PresenceService } from "@/services/presence.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("Channels");

@injectable()
export class ChannelsService {
  constructor(
    @inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository,
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
  ) {}

  public async getChannels({
    authUserId,
    limit = 20,
    cursor = "",
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedChannels> {
    try {
      return await this.channelsRepository.getChannels({ authUserId, limit, cursor, query });
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channels.", null, { cause: error });
    }
  }

  public async getChannel(userId: string, channelId: string): Promise<InboxChannel | null> {
    try {
      return await this.channelsRepository.getChannel(userId, channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channel.", null, { cause: error });
    }
  }

  /** Authorization guard: is `userId` a member of `channelId`? */
  public async isMember(userId: string, channelId: string): Promise<boolean> {
    try {
      return await this.channelsRepository.isMember(userId, channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to verify channel membership.", null, { cause: error });
    }
  }

  /** Returns every member id of a channel the requester belongs to (used for realtime fan-out). */
  public async getMemberIds(userId: string, channelId: string): Promise<string[]> {
    try {
      return await this.channelsRepository.getRawMemberIds(userId, channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channel members.", null, { cause: error });
    }
  }

  public async findChannelOrCreate(userId: string, targetUserId: string): Promise<Channel | null> {
    try {
      const existing = await this.channelsRepository.findExistingDirectChannel(userId, targetUserId);

      if (existing) return existing;

      const createdChannel = await this.channelsRepository.createDirectChannel(userId, targetUserId);

      return createdChannel;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve or create channel", null, { cause: error });
    }
  }

  public async createGroupChannel(
    userId: string,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel | null> {
    try {
      return await this.channelsRepository.createGroupChannel(userId, data);
    } catch (error) {
      throw new HttpException(500, "Failed to create group channel.", null, { cause: error });
    }
  }

  public async updateGroupChannel(
    userId: string,
    channelId: string,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel | null> {
    try {
      const updated = await this.channelsRepository.updateGroupChannel(userId, channelId, data);

      // Membership may have changed — drop the cached roster so the next
      // message send rebuilds it from the DB (add/remove aware). Fire-and-forget:
      // a cache-invalidation failure must not fail the already-committed update.
      this.presenceService.invalidateChannelMembersLookup(channelId).catch((error: unknown) => {
        log.error({ err: error, channelId }, "Failed to invalidate channel members cache");
      });

      return updated;
    } catch (error) {
      throw new HttpException(500, "Failed to update group channel.", null, { cause: error });
    }
  }

  public async updateChannel(channelId: string): Promise<Channel> {
    try {
      return await this.channelsRepository.updateChannel(channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to update channel.", null, { cause: error });
    }
  }
}

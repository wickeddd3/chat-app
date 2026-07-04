import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { ChannelsRepository } from "./channels.repository";
import type { InboxChannel, PaginatedChannels } from "./channels.types";
import type { Channel } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class ChannelsService {
  constructor(@inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository) {}

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

  public async getChannel(userId: string, channelId: number): Promise<InboxChannel | null> {
    try {
      return await this.channelsRepository.getChannel(userId, channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channel.", null, { cause: error });
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
    channelId: number,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel | null> {
    try {
      return await this.channelsRepository.updateGroupChannel(userId, channelId, data);
    } catch (error) {
      throw new HttpException(500, "Failed to update group channel.", null, { cause: error });
    }
  }

  public async updateChannel(channelId: number): Promise<Channel> {
    try {
      return await this.channelsRepository.updateChannel(channelId);
    } catch (error) {
      throw new HttpException(500, "Failed to update channel.", null, { cause: error });
    }
  }
}

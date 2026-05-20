import { ChannelsRepository } from "./channels.repository";
import type { InboxChannel, PaginatedChannels } from "./channels.types";
import type { Channel } from "@/prisma/client";

export class ChannelsService {
  private channelsRepository = new ChannelsRepository();

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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }

  public async getChannel(userId: string, channelId: number): Promise<InboxChannel | null> {
    try {
      return await this.channelsRepository.getChannel(userId, channelId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channel");
    }
  }

  public async findChannelOrCreate(userId: string, targetUserId: string): Promise<Channel | null> {
    try {
      const existing = await this.channelsRepository.findExistingDirectChannel(userId, targetUserId);

      if (existing) return existing;

      const createdChannel = await this.channelsRepository.createDirectChannel(userId, targetUserId);

      return createdChannel;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve or create channel");
    }
  }

  public async createGroupChannel(
    userId: string,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel | null> {
    try {
      return await this.channelsRepository.createGroupChannel(userId, data);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create group channel");
    }
  }

  public async updateGroupChannel(
    userId: string,
    channelId: number,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel | null> {
    try {
      return await this.channelsRepository.updateGroupChannel(userId, channelId, data);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to update group channel");
    }
  }

  public async updateChannel(channelId: number): Promise<Channel> {
    try {
      return await this.channelsRepository.updateChannel(channelId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to update channel");
    }
  }
}

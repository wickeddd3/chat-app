import { ChannelsRepository } from "./channels.repository";
import type { InboxChannel } from "./channels.types";
import type { Channel } from "@/prisma/client";

export class ChannelsService {
  private channelsRepository = new ChannelsRepository();

  public async getChannels(userId: string): Promise<InboxChannel[]> {
    try {
      return await this.channelsRepository.getChannels(userId);
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
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }
}

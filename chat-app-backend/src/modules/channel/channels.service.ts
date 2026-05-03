import type { Channel } from "@/prisma/client";
import { ChannelsRepository } from "./channels.repository";

export class ChannelsService {
  private channelsRepository = new ChannelsRepository();

  public async getChannel(userId: string, targetUserId: string) {
    try {
      const existing = await this.channelsRepository.findExistingDirectChannel(userId, targetUserId);

      if (existing) return existing;

      const createdChannel = await this.channelsRepository.createDirectChannel(userId, targetUserId);

      return createdChannel;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channel");
    }
  }

  public async getChannels(userId: string): Promise<Channel[]> {
    try {
      return await this.channelsRepository.getChannels(userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }
}

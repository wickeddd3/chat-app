import type { Channel } from "@/prisma/client";
import { ChannelsRepository } from "./channels.repository";
import type { InboxChannel } from "./channels.types";

export class ChannelsService {
  private channelsRepository = new ChannelsRepository();

  public async getChannel(userId: string, channelId: number): Promise<InboxChannel | null> {
    try {
      return await this.channelsRepository.getChannel(userId, channelId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channel");
    }
  }

  public async getChannels(userId: string): Promise<InboxChannel[]> {
    try {
      return await this.channelsRepository.getChannels(userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }
}

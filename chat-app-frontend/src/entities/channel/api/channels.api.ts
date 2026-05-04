import apiRequest from "@/shared/lib/axios.client";
import type { InboxChannel } from "../model/channel.types";

export async function getChannel(channelId: string): Promise<InboxChannel> {
  try {
    const { data } = await apiRequest({
      url: `/api/channels/${channelId}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

import apiRequest from "@/shared/lib/axios.client";
import type { Channel } from "../model/channel.types";

export async function getChannel(targetUserId: string): Promise<Channel> {
  try {
    const { data } = await apiRequest({
      url: `/api/channels/${targetUserId}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

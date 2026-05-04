import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function getUserChannel(targetUserId: string): Promise<Channel> {
  try {
    const { data } = await apiRequest({
      url: `/api/channels/find/${targetUserId}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

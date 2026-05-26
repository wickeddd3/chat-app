import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function getUserChannelApi(
  targetUserId: string,
): Promise<Channel> {
  try {
    const url = `/api/channels/find/${targetUserId}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

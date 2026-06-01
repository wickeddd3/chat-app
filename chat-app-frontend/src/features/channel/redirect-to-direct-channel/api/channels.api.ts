import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { Channel } from "@/entities/channel";

export async function getUserChannelApi(
  targetUserId: string,
): Promise<Channel> {
  try {
    const url = `/api/channels/find/${targetUserId}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return responseData.data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

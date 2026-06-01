import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { InboxChannel } from "../model/channel.types";

export async function getChannel(channelId: string): Promise<InboxChannel> {
  try {
    const url = `/api/channels/${channelId}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return responseData.data;
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

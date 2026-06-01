import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { InboxChannel } from "../model/channel.types";

export async function getChannel(channelId: string): Promise<InboxChannel> {
  const safeChannelId = encodeURIComponent(channelId);
  const url = `/api/channels/${safeChannelId}`;

  const response = await apiRequest.get<ApiResponse<InboxChannel>>(url);

  const {
    data: { data },
  } = response;

  return data;
}

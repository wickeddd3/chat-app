import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { Channel } from "@/entities/channel";

export async function getUserChannelApi(
  targetUserId: string,
): Promise<Channel> {
  const safeTargetUserId = encodeURIComponent(targetUserId);
  const url = `/api/channels/find/${safeTargetUserId}`;

  const response = await apiRequest.get<ApiResponse<Channel>>(url);

  const {
    data: { data },
  } = response;

  return data;
}

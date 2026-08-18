import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

export interface LeaveGroupResult {
  channelId: string;
  /** True when the caller was the last member and the channel was removed. */
  channelDeleted: boolean;
}

/**
 * Removes the caller from a group. The server decides the consequences — admin
 * succession, or deleting a channel whose last member just walked out.
 */
export async function leaveGroupChannelApi({
  channelId,
}: {
  channelId: string;
}): Promise<LeaveGroupResult> {
  const safeId = encodeURIComponent(channelId);
  const url = `/api/channels/group/${safeId}/members/me`;

  const response = await apiRequest.delete<ApiResponse<LeaveGroupResult>>(url);

  const {
    data: { data },
  } = response;

  return data;
}

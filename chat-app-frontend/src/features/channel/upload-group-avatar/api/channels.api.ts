import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { Channel } from "@/entities/channel";

/** `null` clears the group avatar back to the initials fallback. Admin-only. */
export async function updateGroupAvatarApi({
  channelId,
  image,
}: {
  channelId: string;
  image: string | null;
}): Promise<Channel> {
  const safeId = encodeURIComponent(channelId);
  const url = `/api/channels/group/${safeId}/image`;

  const response = await apiRequest.patch<ApiResponse<Channel>>(url, { image });

  const {
    data: { data },
  } = response;

  return data;
}

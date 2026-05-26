import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function updateGroupChannelApi(
  channelId: string,
  formData: {
    name: string;
    memberIds: string[];
  },
): Promise<Channel> {
  try {
    const url = `/api/channels/group/${channelId}`;
    const { data } = await apiRequest({ url }).post(formData);

    return data;
  } catch (error) {
    console.error("Error updating group channel:", error);
    throw error;
  }
}

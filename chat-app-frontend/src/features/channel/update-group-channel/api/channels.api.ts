import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function updateGroupChannel(
  channelId: string,
  formData: {
    name: string;
    memberIds: string[];
  },
): Promise<Channel> {
  try {
    const { data } = await apiRequest({
      url: `/api/channels/group/${channelId}`,
    }).post(formData);
    return data;
  } catch (error) {
    console.error("Error updating group channel:", error);
    throw error;
  }
}

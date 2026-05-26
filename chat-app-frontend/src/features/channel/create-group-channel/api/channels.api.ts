import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function createGroupChannelApi(formData: {
  name: string;
  memberIds: string[];
}): Promise<Channel> {
  try {
    const url = "/api/channels/group";
    const { data } = await apiRequest({ url }).post(formData);

    return data;
  } catch (error) {
    console.error("Error creating group channel:", error);
    throw error;
  }
}

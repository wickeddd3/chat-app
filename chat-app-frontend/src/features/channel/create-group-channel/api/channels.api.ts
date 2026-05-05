import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function createGroupChannel(formData: {
  name: string;
  memberIds: string[];
}): Promise<Channel> {
  try {
    const { data } = await apiRequest({
      url: "/api/channels/group",
    }).post(formData);
    return data;
  } catch (error) {
    console.error("Error creating group channel:", error);
    throw error;
  }
}

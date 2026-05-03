import type { Message } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";

export async function getMessages(channelId: string): Promise<Message[]> {
  try {
    const { data } = await apiRequest({
      url: `/api/messages/${channelId}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

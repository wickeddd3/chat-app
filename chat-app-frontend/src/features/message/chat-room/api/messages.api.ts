import type { Message } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";

export async function getMessages(roomId: string): Promise<Partial<Message[]>> {
  try {
    const { data } = await apiRequest({
      url: `/api/messages/inbox/${roomId}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

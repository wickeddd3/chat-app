import type { InboxItem } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";

export async function getInbox(): Promise<Partial<InboxItem[]>> {
  try {
    const { data } = await apiRequest({
      url: "api/messages/inbox",
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
}

import type { InboxChannel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function getInbox(): Promise<InboxChannel[]> {
  try {
    const { data } = await apiRequest({
      url: "api/channels",
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
}

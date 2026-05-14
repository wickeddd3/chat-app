import type { PaginatedInboxChannel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function getInbox<T>(cursor: T): Promise<PaginatedInboxChannel> {
  try {
    const queryParams = cursor ? `?cursor=${cursor}` : "";
    const { data } = await apiRequest({
      url: `api/channels${queryParams}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
}

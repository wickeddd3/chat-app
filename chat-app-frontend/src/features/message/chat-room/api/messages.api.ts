import type { PaginatedMessage } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getMessagesApi({
  channelId,
  params,
}: {
  channelId: string;
  params: Record<string, any>;
}): Promise<PaginatedMessage> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/messages/${channelId}${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

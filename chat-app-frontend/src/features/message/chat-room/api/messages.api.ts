import type { PaginatedMessage } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
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

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return {
      messages: responseData.data,
      hasMore: responseData.meta?.hasMore || false,
      nextCursor: responseData.meta?.nextCursor || null,
    };
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

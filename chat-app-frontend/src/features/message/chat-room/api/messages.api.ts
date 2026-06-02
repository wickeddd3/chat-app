import type { Message, PaginatedMessage } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";

export async function getMessagesApi({
  channelId,
  params,
}: {
  channelId: string;
  params: QueryParams;
}): Promise<PaginatedMessage> {
  const queryParams = toQueryParams(params);
  const url = `/api/messages/${channelId}${queryParams}`;

  const response = await apiRequest.get<ApiResponse<Message[]>>(url);

  const {
    data: {
      data,
      meta: { hasMore, nextCursor } = { hasMore: false, nextCursor: null },
    },
  } = response;

  return {
    messages: data,
    hasMore,
    nextCursor,
  };
}

import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getInboxApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedInboxChannel> {
  const queryParams = toQueryParams(params);
  const url = `/api/channels${queryParams}`;

  const response = await apiRequest.get<ApiResponse<InboxChannel[]>>(url);

  const {
    data: {
      data,
      meta: { hasMore, nextCursor } = { hasMore: false, nextCursor: null },
    },
  } = response;

  return {
    channels: data,
    hasMore,
    nextCursor,
  };
}
